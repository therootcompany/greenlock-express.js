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

  // if another worker updates the certs,
  // receive a copy from master here as well
  // and update the sni cache manually
  process.on('message', function (msg) {
    if ('LE_RESPONSE' === msg.type && msg.certs) {
      opts.sni.cacheCerts(msg.certs);
    }
  });

  opts.sni = require('le-sni-auto').create({
    notBefore: opts.notBefore || (10 * 24 * 60 * 60 * 1000)
  , notAfter: opts.notAfter || (5 * 24 * 60 * 60 * 1000)
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
