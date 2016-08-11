'use strict';

module.exports.create = function (opts) {



  opts.workerSniCallback = require('le-sni-auto').create({
    notBefore: opts.notBefore || (10 * 24 * 60 * 60 * 1000)
  , notAfter: opts.notAfter || (5 * 24 * 60 * 60 * 1000)
  , getCertificates: function (domain, certs, cb) {
      opts.approveDomains(domain, certs, function (err, certs) {
        process.send({ type: 'LE_REQUEST', domain: domain, options: { domains: [domain] }, certs: certs });

        process.on('message', function (msg) {
          if (msg.domain === domain) {
            cb(msg.certs);
          }
        });
      });
    }
  }).sniCallback;



  opts.httpsOptions = require('localhost.daplie.com-certificates').merge({ SNICallback: opts.workerSniCallback });



  opts.challenge = {
    get: opts.getChallenge
      || (opts.challenge && opts.challenge.get)
      || require('le-challenge-fs').create({ webrootPath: opts.webrootPath }).get
  };



  // opts.challenge.get, opts.acmeChallengePrefix
  opts.middleware = require('letsencrypt/lib/middleware').create(opts);



  return opts;
};
