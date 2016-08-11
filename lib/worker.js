'use strict';

function log(debug) {
	if (!debug) {
		return;
	}

	var args = Array.prototype.slice.call(arguments);
	args.shift();
	args.unshift("[le/lib/core.js]");
	console.log.apply(console, args);
}



module.exports.create = function (opts) {



  opts.sni = require('le-sni-auto').create({
    notBefore: opts.notBefore || (10 * 24 * 60 * 60 * 1000)
  , notAfter: opts.notAfter || (5 * 24 * 60 * 60 * 1000)
  , getCertificates: function (domain, certs, cb) {
      opts.approveDomains(domain, certs, function (err, certs) {
        process.send({ type: 'LE_REQUEST', domain: domain, options: { domains: [domain] }, certs: certs });

        process.on('message', function (msg) {
          log(opts.debug, 'Message from master');
          log(opts.debug, msg);

          if (msg.domain === domain) {
            cb(null, msg.certs);
          }
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
