'use strict';

module.exports.create = function (opts) {
  if (!opts.letsencrypt) { opts.letsencrypt = require('letsencrypt').create({ server: opts.server }); }
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

  opts._le = opts.letsencrypt;
  opts.addWorker = function (worker) {

    worker.on('online', function () {
      log(opts.debug, 'worker is up');
    });

    worker.on('message', function (msg) {
      log(opts.debug, 'Message from worker ' + worker.pid, msg, msg && msg.type);
      if ('LE_REQUEST' !== (msg && msg.type)) {
        return;
      }

      opts.approveDomains(msg.domain, msg.certs, function (err, results) {
        if (err) {
          log(opts.debug, 'Approval got ERROR', err.stack || err);
          worker.send({ type: 'LE_RESPONSE', error: err });
          return;
        }

        var promise;

        if (results.certs) {
          promise = opts._le.renew(results.options, results.certs);
        }
        else {
          promise = opts._le.register(results.options);
        }

        promise.then(function (certs) {
          log(opts.debug, 'Approval got certs', certs);
          // certs = { subject, domains, issuedAt, expiresAt, privkey, cert, chain };
          worker.send({ type: 'LE_RESPONSE', certs: certs });
        }, function (err) {
          log(opts.debug, 'Approval got ERROR', err.stack || err);
          worker.send({ type: 'LE_RESPONSE', error: err });
        });
      });
    });
  };

  return opts;
};
