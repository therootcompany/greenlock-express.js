'use strict';

// opts = { notBefore, notAfter, renew, register, httpsOptions }
module.exports.create = function (opts) {

  if (!opts.notBefore) { throw new Error("must supply options.notBefore (and options.notAfter)"); }
  if (!opts.notAfter) { opts.notAfter = opts.notBefore - (3 * 24 * 60 * 60 * 1000); }
  if (!opts.httpsOptions) { opts.httpOptions = {}; }




  //opts.renewWithin = opts.notBefore;                    // i.e. 15 days
  opts.renewWindow = opts.notBefore - opts.notAfter;      // i.e. 1 day
  //opts.renewRatio = opts.notBefore = opts.renewWindow;  // i.e. 1/15 (6.67%)




  var tls = require('tls');




  var snicb = {




    // in-process cache
    _ipc: {}
    // just to account for clock skew
  , _fiveMin: 5 * 60 * 1000




    // cache and format incoming certs
  , cacheCerts: function (certs) {
      var meta = {
        certs: certs
      , tlsContext: tls.createSecureContext({
          key: certs.privkey
        , cert: certs.cert + certs.chain
        , rejectUnauthorized: opts.httpsOptions.rejectUnauthorized

        , requestCert: opts.httpsOptions.requestCert  // request peer verification
        , ca: opts.httpsOptions.ca                    // this chain is for incoming peer connctions
        , crl: opts.httpsOptions.crl                  // this crl is for incoming peer connections
        })

      , subject: certs.subject
        // stagger renewal time by a little bit of randomness
      , renewAt: (certs.expiresAt - (opts.notBefore - (opts.renewWindow * Math.random())))
        // err just barely on the side of safety
      , expiresNear: certs.expiresAt - snicb._fiveMin
      };

      certs.altnames.forEach(function (domain) {
        snicb._ipc[domain] = { subject: certs.subject };
      });
      snicb._ipc[certs.subject] = meta;

      return meta;
    }




    // automate certificate registration on request
  , sniCallback: function (domain, cb) {
      var certMeta = snicb._ipc[domain];
      var promise;
      var now = Date.now();

      if (certMeta && certMeta.subject !== domain) {
        certMeta = snicb._ipc[domain];
      }

      if (!certMeta) {
        // we don't have a cert and must get one
        promise = opts.register(domain);
      }
      else if (now >= certMeta.expiresNear) {
        // we have a cert, but it's no good for the average user
        promise = opts.renew(domain, certMeta.certs);
      } else {

        // we could stand to try to renew the cert
        if (now >= certMeta.renewAt) {
          // give the cert some time to be validated and replaced before trying again
          certMeta.renewAt = Date.now() + (2 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000 * Math.random());
          // let the update happen in the background
          opts.renew(domain, certMeta.certs).then(snicb.cacheCerts);
        }

        // return the valid cert right away
        cb(null, certMeta.certs);
        return;
      }

      // promise the non-existent or expired cert
      promise.then(snicb.cacheCerts).then(function (certMeta) {
        cb(null, certMeta.tlsContext);
      }, cb);
    }




  };

  return snicb;
};
