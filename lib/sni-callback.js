'use strict';

var crypto = require('crypto');
var tls = require('tls');

module.exports.create = function (opts) {
  if (opts.debug) {
    console.log("[LEX] creating sniCallback", JSON.stringify(opts, null, '  '));
  }
  var ipc = {}; // in-process cache

  if (!opts) { throw new Error("requires opts to be an object"); }
  if (!opts.letsencrypt) { throw new Error("requires opts.letsencrypt to be a letsencrypt instance"); }

  if (!opts.lifetime) { opts.lifetime = 90 * 24 * 60 * 60 * 1000; }
  if (!opts.failedWait) { opts.failedWait = 5 * 60 * 1000; }
  if (!opts.renewWithin) { opts.renewWithin = 3 * 24 * 60 * 60 * 1000; }
  if (!opts.memorizeFor) { opts.memorizeFor = 1 * 24 * 60 * 60 * 1000; }

  if (!opts.approveRegistration) { opts.approveRegistration = function (hostname, cb) { cb(null, null); }; }
  if (!opts.handleRenewFailure) { opts.handleRenewFailure = function (/*err, hostname, certInfo*/) {}; }

  function assignBestByDates(now, certInfo) {
    certInfo = certInfo || { loadedAt: now, expiresAt: 0, issuedAt: 0, lifetime: 0 };

    var rnds = crypto.randomBytes(3)[0];
    var rnd1 = ((rnds[0] + 1) / 257);
    var rnd2 = ((rnds[1] + 1) / 257);
    var rnd3 = ((rnds[2] + 1) / 257);

    // Stagger randomly by plus 0% to 25% to prevent all caches expiring at once
    var memorizeFor = Math.floor(opts.memorizeFor + ((opts.memorizeFor / 4) * rnd1));
    // Stagger randomly to renew between n and 2n days before renewal is due
    // this *greatly* reduces the risk of multiple cluster processes renewing the same domain at once
    var bestIfUsedBy = certInfo.expiresAt - (opts.renewWithin + Math.floor(opts.renewWithin * rnd2));
    // Stagger randomly by plus 0 to 5 min to reduce risk of multiple cluster processes
    // renewing at once on boot when the certs have expired
    var renewTimeout = Math.floor((5 * 60 * 1000) * rnd3);

    certInfo.loadedAt = now;
    certInfo.memorizeFor = memorizeFor;
    certInfo.bestIfUsedBy = bestIfUsedBy;
    certInfo.renewTimeout = renewTimeout;
  }

  function renewInBackground(now, hostname, certInfo) {
    if ((now - certInfo.loadedAt) < opts.failedWait) {
      // wait a few minutes
      return;
    }

    if (now > certInfo.bestIfUsedBy && !certInfo.timeout) {
      // EXPIRING
      if (now > certInfo.expiresAt) {
        // EXPIRED
        certInfo.renewTimeout = Math.floor(certInfo.renewTimeout / 2);
      }

      if (opts.debug) {
        console.log("[LEX] skipping stagger '" + certInfo.renewTimeout + "' and renewing '" + hostname + "' now");
        certInfo.renewTimeout = 500;
      }

      certInfo.timeout = setTimeout(function () {
        var args = { domains: [ hostname ], duplicate: false };
        opts.letsencrypt.renew(args, function (err, certInfo) {
          if (err || !certInfo) {
            opts.handleRenewFailure(err, hostname, certInfo);
          }
          ipc[hostname] = assignBestByDates(now, certInfo);
        });
      }, certInfo.renewTimeout);
    }
  }

  function fetch(hostname, cb) {
    opts.letsencrypt.fetch({ domains: [hostname] }, function (err, certInfo) {
      if (opts.debug) {
        console.log("[LEX] fetch result '" + hostname + "':");
        console.log(err, certInfo);
      }
      if (err) {
        cb(err);
        return;
      }

      var now = Date.now();

      if (!certInfo) {
        // handles registration
        if (opts.debug) {
          console.log("[LEX] '" + hostname + "' is not registered, requesting approval");
        }
        opts.approveRegistration(hostname, function (err, args) {
          if (opts.debug) {
            console.log("[LEX] '" + hostname + "' registration approved, attempting register");
          }
          if (err || !(args && args.agreeTos)) {
            done(err, certInfo);
            return;
          }
          opts.letsencrypt.register(args, function (err, certInfo) {
            if (opts.debug) {
              console.log("[LEX] '" + hostname + "' register completed", err, certInfo);
            }
            done(err, certInfo);
          });
        });
        return;
      }

      done(err, certInfo);

      function done(err, certInfo) {
        ipc[hostname] = assignBestByDates(now, certInfo);

        // handles renewals
        renewInBackground(now, hostname, certInfo);

        if (err) {
          cb(err);
          return;
        }

        if (!certInfo.tlsContext && null !== certInfo.tlsContext) {
          try {
            certInfo.tlsContext = tls.createSecureContext({
              key: certInfo.key                             // privkey.pem
            , cert: certInfo.cert                           // fullchain.pem (cert.pem + '\n' + chain.pem)
            });
          } catch(e) {
            certInfo.tlsContext = null;
            console.warn("[Sanity Check Fail]: a weird object was passed back through le.fetch to lex.fetch");
            cb(e);
            return;
          }
        }

        cb(null, certInfo.tlsContext);
      }
    });
  }

  return function sniCallback(hostname, cb) {
    var now = Date.now();
    var certInfo = ipc[hostname];

    // TODO once ECDSA is available, wait for cert renewal if its due
    if (!certInfo) {
      if (opts.debug) {
        console.log("[LEX] no certs loaded for '" + hostname + "'");
      }
      fetch(hostname, cb);
      return;
    }

    if (certInfo.tlsContext) {
      cb(null, certInfo.tlsContext);

      if ((now - certInfo.loadedAt) < (certInfo.memorizeFor)) {
        // these aren't stale, so don't fall through
        if (opts.debug) {
          console.log("[LEX] certs for '" + hostname + "' are fresh from disk");
        }
        return;
      }
    }
    else if ((now - certInfo.loadedAt) < opts.failedWait) {
      if (opts.debug) {
        console.log("[LEX] certs for '" + hostname + "' recently failed and are still in cool down");
      }
      // this was just fetched and failed, wait a few minutes
      cb(null, null);
      return;
    }

    if (opts.debug) {
      console.log("[LEX] certs for '" + hostname + "' are stale on disk and should be will be fetched again");
    }
    fetch(hostname, cb);
  };
};
