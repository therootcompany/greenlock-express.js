'use strict';

var cluster = require('cluster');

module.exports.init = function (sharedOpts) {
  var numCores = 2; // // Math.max(2, require('os').cpus().length)
  var i;
  var master = require('../master').create({
    debug: true



  , server: 'staging'
  , webrootPath: sharedOpts.webrootPath



  , approveDomains: function (masterOptions, certs, cb) {
      // Depending on your setup it may be more efficient
      // for you to implement the approveDomains function
      // in your master or in your workers.
      //
      // Since we implement it in the worker (below) in this example
      // we'll give it an immediate approval here in the master
      var results = { domain: masterOptions.domain, options: masterOptions, certs: certs };
      cb(null, results);
    }
  });



  for (i = 0; i < numCores; i += 1) {
    master.addWorker(cluster.fork());
  }
};
