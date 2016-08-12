'use strict';

module.exports.init = function (sharedOpts) {
  var worker = require('../worker').create({
    debug: true



    // We want both to renew well before the expiration date
    // and also to stagger the renewals, just a touch
    // here we specify to renew between 10 and 15 days
  , renewWithin: sharedOpts.renewWithin
  , renewBy: 10 * 24 * 60 * 60 * 1000 // optional



  , webrootPath: sharedOpts.webrootPath



    /*
    challenge: {
      get: function (ignored, domain, token, cb) {
        cb(null, keyAuthorization);
      }
    }
  , getChallenge: function (domain, token, cb) {
      // the default behavior is to use le-challenge-fs
      // TODO maybe provide a built-in option to pass a message to master to use its
      // but you could overwrite that with a function to pass a message to master or,
      // but if needed for performance, that can be overwritten here
      cb(null, );
    }
    */


    // There are two approval processes:
    // 1. emails are tied to private keys (accounts) which must agree to the tos url
    // 2. domains are tied to accounts (and should be verifiable via loopback)
  , approveDomains: function (workerOptions, certs, cb) {
      // opts = { domains, email, agreeTos, tosUrl }
      // certs = { subject, altnames, expiresAt, issuedAt }
      var results = {
        domain: workerOptions.domains[0]
      , options: {
          domains: certs && certs.altnames || workerOptions.domains
        , email: 'john.doe@example.com'
        , agreeTos: true
        }
      , certs: certs
      };



      // We might want to do a check to make sure that all of the domains
      // specified in altnames are still approved to be renewed and have
      // the correct dns entries, but generally speaking it's probably okay
      // for renewals to be automatic
      if (certs) {
        // modify opts.domains to overwrite certs.altnames in renewal
        cb(null, results);
        return;
      }




      // This is where we would check our database to make sure that
      // this user (specified by email address) has agreed to the terms
      // and do some check that they have access to this domain
      cb(null, results);
    }
  });

  function app(req, res) {
    res.end("Hello, World!");
  }


  // worker.handleAcmeOrRedirectToHttps()
  // worker.handleAcmeOrUse(app)
  var redirectHttps = require('redirect-https')();
  var plainServer = require('http').createServer(worker.middleware(redirectHttps));
  var server = require('https').createServer(worker.httpsOptions, worker.middleware(app));
  plainServer.listen(80);
  server.listen(443);
};
