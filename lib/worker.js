'use strict';

module.exports.create = function (opts) {

  opts.workerSniCallback = require('le-sni-auto').create({
    getCertificates: function (domain, certs, cb) {
      opts.approveDomains(domain, certs, function (err, certs) {
        process.send({ type: 'LE_REQUEST', domain: domain, options: { domains: [domain] } certs: certs });

        process.on('message', function (msg) {
          if (msg.domain === domain) {
            cb(msg.certs);
          }
        });
      });
    }
  }).sniCallback;

  return opts;
};
