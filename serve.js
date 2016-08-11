'use strict';

var cluster = require('cluster');

function runMaster() {
  var numCores = 2; // // Math.max(2, require('os').cpus().length)
  var i;
  var master = require('./lib/master').create({
    debug: true



  , server: 'staging'



  , approveDomains: function (domain, certs, cb) {
      // Depending on your setup it may be more efficient
      // for you to implement the approveDomains function
      // in your master or in your workers.
      //
      // Since we implement it in the worker (below) in this example
      // we'll give it an immediate approval here in the master
      var results = { domain: domain, options: { domains: [domain] }, certs: certs };
      cb(null, results);
    }
  });



  for (i = 0; i < numCores; i += 1) {
    master.addWorker(cluster.fork());
  }
}

function runWorker() {
  var worker = require('./lib/worker').create({
    debug: true

    // We want both to renew well before the expiration date
    // and also to stagger the renewals, just a touch
    // here we specify to renew between 10 and 15 days
  , notBefore: 15 * 24 * 60 * 60 * 1000
  , notAfter: 10 * 24 * 60 * 60 * 1000 // optional

    /*
  , getChallenge: function (domain, token, cb) {
      // the default behavior is to pass a message to master,
      // but if needed for performance, that can be overwritten here
      cb(null, );
    }
    */
  , approveDomains: function (domain, certs, cb) {
      // opts = { domains, email, agreeTos, tosUrl }
      // certs = { subject, altnames, expiresAt, issuedAt }
      var results = { domain: domain, options: { domains: [domain] }, certs: certs };



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
}

if (cluster.isMaster) {
  runMaster();
}
else {
  runWorker();
}
