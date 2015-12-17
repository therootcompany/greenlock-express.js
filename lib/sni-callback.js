'use strict';

var crypto = require('crypto');
var tls = require('tls');

module.exports.create = function (memos) {
  var ipc = {}; // in-process cache

  if (!memos) { throw new Error("requires opts to be an object"); }
  if (!memos.letsencrypt) { throw new Error("requires opts.letsencrypt to be a letsencrypt instance"); }

  if (!memos.lifetime) { memos.lifetime = 90 * 24 * 60 * 60 * 1000; }
  if (!memos.failedWait) { memos.failedWait = 5 * 60 * 1000; }
  if (!memos.renewWithin) { memos.renewWithin = 3 * 24 * 60 * 60 * 1000; }
  if (!memos.memorizeFor) { memos.memorizeFor = 1 * 24 * 60 * 60 * 1000; }

  if (!memos.handleRegistration) { memos.handleRegistration = function (args, cb) { cb(null, null); }; }
  if (!memos.handleRenewFailure) { memos.handleRenewFailure = function () {}; }

  function assignBestByDates(now, certInfo) {
    certInfo = certInfo || { loadedAt: now, expiresAt: 0, issuedAt: 0, lifetime: 0 };

    var rnds = crypto.randomBytes(3)[0];
    var rnd1 = ((rnds[0] + 1) / 257);
    var rnd2 = ((rnds[1] + 1) / 257);
    var rnd3 = ((rnds[2] + 1) / 257);

    // Stagger randomly by plus 0% to 25% to prevent all caches expiring at once
    var memorizeFor = Math.floor(memos.memorizeFor + ((memos.memorizeFor / 4) * rnd1));
    // Stagger randomly to renew between n and 2n days before renewal is due
    // this *greatly* reduces the risk of multiple cluster processes renewing the same domain at once
    var bestIfUsedBy = certInfo.expiresAt - (memos.renewWithin + Math.floor(memos.renewWithin * rnd2));
    // Stagger randomly by plus 0 to 5 min to reduce risk of multiple cluster processes
    // renewing at once on boot when the certs have expired
    var renewTimeout = Math.floor((5 * 60 * 1000) * rnd3);

    certInfo.loadedAt = now;
    certInfo.memorizeFor = memorizeFor;
    certInfo.bestIfUsedBy = bestIfUsedBy;
    certInfo.renewTimeout = renewTimeout;
  }

  function renewInBackground(now, hostname, certInfo) {
    if ((now - certInfo.loadedAt) < memos.failedWait) {
      // wait a few minutes
      return;
    }

    if (now > certInfo.bestIfUsedBy && !certInfo.timeout) {
      // EXPIRING
      if (now > certInfo.expiresAt) {
        // EXPIRED
        certInfo.renewTimeout = Math.floor(certInfo.renewTimeout / 2);
      }

      certInfo.timeout = setTimeout(function () {
        var opts = { domains: [ hostname ], duplicate: false };
        le.renew(opts, function (err, certInfo) {
          if (err || !certInfo) {
            memos.handleRenewFailure(err, certInfo, opts);
          }
          ipc[hostname] = assignBestByDates(now, certInfo);
        });
      }, certInfo.renewTimeout);
    }
  }

  function fetch(hostname, cb) {
    le.fetch({ domains: [hostname] }, function (err, certInfo) {
      var now = Date.now();

      ipc[hostname] = assignBestByDates(now, certInfo);
      if (!certInfo) {
        // handles registration
        memos.handleRegistration(hostname, cb);
        return;
      }

      // handles renewals
      renewInBackground(now, hostname, certInfo);

      if (err) {
        cb(err);
        return;
      }

      try {
        certInfo.tlsContext = tls.createSecureContext({
          key: certInfo.key                             // privkey.pem
        , cert: certInfo.cert                           // fullchain.pem (cert.pem + '\n' + chain.pem)
        });
      } catch(e) {
        console.warn("[Sanity Check Fail]: a weird object was passed back through le.fetch to lex.fetch");
        cb(e);
        return;
      }

      cb(null, certInfo.tlsContext);
    });
  }

  return function sniCallback(hostname, cb) {
    var now = Date.now();
    var certInfo = ipc[hostname];

    // TODO once ECDSA is available, wait for cert renewal if its due
    if (!certInfo) {
      fetch(hostname, cb);
      return;
    }

    if (certInfo.context) {
      cb(null, certInfo.context);

      if ((now - certInfo.loadedAt) < (certInfo.memorizeFor)) {
        // these aren't stale, so don't fall through
        return;
      }
    }
    else if ((now - certInfo.loadedAt) < memos.failedWait) {
      // this was just fetched and failed, wait a few minutes
      cb(null, null);
      return;
    }

    fetch({ domains: [hostname] }, cb);
  };
};
