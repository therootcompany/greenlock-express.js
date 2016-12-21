'use strict';

// opts.approveDomains(options, certs, cb)
module.exports.create = function (opts) {
  // accept all defaults for le.challenges, le.store, le.middleware
  var le = require('letsencrypt').create(opts);

  opts.app = opts.app || function (req, res) {
    res.end("Hello, World!\nWith Love,\nLet's Encrypt Express");
  };

  opts.listen = function (plainPort, port) {
    var PromiseA;
    try {
      PromiseA = require('bluebird');
    } catch(e) {
      console.warn("Package 'bluebird' not installed. Using global.Promise instead");
      console.warn("(want bluebird instead? npm install --save bluebird)");
      PromiseA = global.Promise;
    }
    var promises = [];
    var plainPorts = plainPort;
    var ports = port;
    var servers = [];

    if (!plainPorts) {
      plainPorts = 80;
    }
    if (!ports) {
      ports = 443;
    }

    if (!Array.isArray(plainPorts)) {
      plainPorts = [ plainPorts ];
      ports = [ ports ];
    }

    plainPorts.forEach(function (p) {
      promises.push(new PromiseA(function (resolve, reject) {
        require('http').createServer(le.middleware(require('redirect-https')())).listen(p, function () {
          console.log("Handling ACME challenges and redirecting to https on plain port " + p);
          resolve();
        }).on('error', reject);
      }));
    });

    ports.forEach(function (p) {
      promises.push(new PromiseA(function (resolve, reject) {
        var server = require('https').createServer(le.httpsOptions, le.middleware(le.app)).listen(p, function () {
          console.log("Handling ACME challenges and serving https " + p);
          resolve();
        }).on('error', reject);
        servers.push(server);
      }));
    });

    if (!Array.isArray(port)) {
      servers = servers[0];
    }

    return servers;
  };


  return le;
};
