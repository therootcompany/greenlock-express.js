'use strict';

// opts = { renewWithin, renew, register, httpsOptions }
module.exports.create = function (opts) {
  var tls = require('tls');

  var snicb = {




    // in-process cache
    _ipc: {}




    // just to account for clock skew
  , _fiveMin: 5 * 60 * 1000




    // cache and format incoming certs
  , cacheCerts: function (certs) {
      certs.altnames.forEach(function (domain) {
        snicb._ipc[domain] = { subject: certs.subject };
      });
      snicb._ipc[certs.subject] = certs;

      certs.tlsContext = tls.createSecureContext({
        key: certs.privkey
      , cert: certs.cert + certs.chain
      , rejectUnauthorized: opts.httpsOptions.rejectUnauthorized

      , requestCert: opts.httpsOptions.requestCert  // request peer verification
      , ca: opts.httpsOptions.ca                    // this chain is for incoming peer connctions
      , crl: opts.httpsOptions.crl                  // this crl is for incoming peer connections
      });

      return certs;
    }




    // automate certificate registration on request
  , sniCallback: function (domain, cb) {
      var certs = snicb._ipc[domain];
      var promise;
      var now = Date.now();

      if (certs && certs.subject !== domain) {
        certs = snicb._ipc[domain];
      }

      // err just barely on the side of safety
      if (!certs) {
        promise = opts.register(domain);
      }
      else if (now >= (certs.expiresAt - snicb._fiveMin)) {
        promise = opts.renew(domain, certs);
      }
      else {
        if (now >= (certs.expiresAt - opts.renewWithin)) {
          // in background
          opts.renew(domain, certs).then(snicb.cacheCerts);
        }
        cb(null, certs);
        return;
      }

      promise.then(snicb.cacheCerts).then(function (certs) {
        cb(null, certs.tlsContext);
      }, cb);
    }




  };

  return snicb;
};
