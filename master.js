'use strict';

// opts.addWorker(worker)
// opts.approveDomains(options, certs, cb)
module.exports.create = function (opts) {
  opts = opts || { };
  opts._workers = [];
  opts.webrootPath = opts.webrootPath || require('os').tmpdir() + require('path').sep + 'acme-challenge';
  if (!opts.letsencrypt) { opts.letsencrypt = require('letsencrypt').create(opts); }
  if ('function' !== typeof opts.approveDomains) {
    throw new Error("You must provide opts.approveDomains(domain, certs, callback) to approve certificates");
  }

  function log(debug) {
    if (!debug) {
      return;
    }

    var args = Array.prototype.slice.call(arguments);
    args.shift();
    args.unshift("[le/lib/core.js]");
    console.log.apply(console, args);
  }

  opts.addWorker = function (worker) {
    opts._workers.push(worker);

    worker.on('online', function () {
      log(opts.debug, 'worker is up');
    });

    worker.on('message', function (msg) {
      log(opts.debug, 'Message from worker ' + worker.id);
      if ('LE_REQUEST' !== (msg && msg.type)) {
        log(opts.debug, 'Ignoring irrelevant message');
        log(opts.debug, msg);
        return;
      }

      log(opts.debug, 'about to approveDomains');
      opts.approveDomains(msg.options, msg.certs, function (err, results) {
        if (err) {
          log(opts.debug, 'Approval got ERROR', err.stack || err);
          worker.send({
            type: 'LE_RESPONSE'
          , domain: msg.domain
          , error: { message: err.message, code: err.code, stack: err.stack }
          });
          return;
        }

        var promise;

        //
        /*
        var certs = require('localhost.daplie.com-certificates').merge({
          subject: msg.domain
        , altnames: [ msg.domain ]
        , issuedAt: Date.now()
        , expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000)
        });
        certs.privkey = certs.key.toString('ascii');
        certs.cert = certs.cert.toString('ascii');
        certs.chain = '';
        worker.send({ type: 'LE_RESPONSE', domain: msg.domain, certs: certs });
        return;
        // */

        if (results.certs) {
          promise = opts.letsencrypt.renew(results.options, results.certs);
        }
        else {
          promise = opts.letsencrypt.register(results.options);
        }

        promise.then(function (certs) {
          log(opts.debug, 'Approval got certs', certs);
          // certs = { subject, domains, issuedAt, expiresAt, privkey, cert, chain };
          opts._workers.forEach(function (w) {
            w.send({ type: 'LE_RESPONSE', domain: msg.domain, certs: certs });
          });
        }, function (err) {
          log(opts.debug, 'Approval got ERROR', err.stack || err);
          worker.send({ type: 'LE_RESPONSE', domain: msg.domain, error: err });
        });
      });
    });
  };

  return opts;
};

module.exports.create = function (opts) {

  // if another worker updates the certs,
  // receive a copy from master here as well
  // and update the sni cache manually
  process.on('message', function (msg) {
    if ('LE_RESPONSE' === msg.type && msg.certs) {
      opts.sni.cacheCerts(msg.certs);
    }
  });

  opts.sni = require('le-sni-auto').create({
    renewWithin: opts.renewWithin || (10 * 24 * 60 * 60 * 1000)
  , renewBy: opts.renewBy || (5 * 24 * 60 * 60 * 1000)
  , getCertificates: function (domain, certs, cb) {
      var workerOptions = { domains: [ domain ] };
      opts.approveDomains(workerOptions, certs, function (_err, results) {
        if (_err) {
          cb(_err);
          return;
        }

        var err = new Error("___MESSAGE___");
        process.send({ type: 'LE_REQUEST', domain: domain, options: results.options, certs: results.certs });

        process.on('message', function (msg) {
          log(opts.debug, 'Message from master');
          log(opts.debug, msg);

          if (msg.domain !== domain) {
            return;
          }

          if (msg.error) {
            err.message = msg.error.message || "unknown error sent from cluster master to worker";
            err.stack.replace("___MESSAGE___", err.message);
            err = {
              message: err.message
            , stack: err.stack
            , data: { options: workerOptions, certs: certs }
            };
          } else {
            err = null;
          }

          cb(err, msg.certs);
        });
      });
    }
  });



  opts.httpsOptions = require('localhost.daplie.com-certificates').merge({ SNICallback: opts.sni.sniCallback });



  opts.challenge = {
    get: opts.getChallenge
      || (opts.challenge && opts.challenge.get)
      || require('le-challenge-fs').create({ webrootPath: opts.webrootPath }).get
  };



  // opts.challenge.get, opts.acmeChallengePrefix
  opts.middleware = require('letsencrypt/lib/middleware').create(opts);



  return opts;
};
