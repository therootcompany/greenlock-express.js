'use strict';

// opts.approveDomains(options, certs, cb)
module.exports.create = function (opts) {
  // accept all defaults for le.challenges, le.store, le.middleware
  opts._communityPackage = opts._communityPackage || 'greenlock-express.js';
  var le = require('greenlock').create(opts);

  opts.app = opts.app || function (req, res) {
    res.end("Hello, World!\nWith Love,\nGreenlock for Express.js");
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

    function explainError(e) {
      console.error('Error:' + e.message);
      if ('EACCES' === e.errno) {
        console.error("You don't have prmission to access '" + e.address + ":" + e.port + "'.");
        console.error("You probably need to use \"sudo\" or \"sudo setcap 'cap_net_bind_service=+ep' $(which node)\"");
        return;
      }
      if ('EADDRINUSE' === e.errno) {
        console.error("'" + e.address + ":" + e.port + "' is already being used by some other program.");
        console.error("You probably need to stop that program or restart your computer.");
        return;
      }
      console.error(e.code + ": '" + e.address + ":" + e.port + "'");
    }

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
      if (!(parseInt(p, 10) >= 0)) { console.warn("'" + p + "' doesn't seem to be a valid port number for http"); }
      promises.push(new PromiseA(function (resolve) {
        require('http').createServer(le.middleware(require('redirect-https')())).listen(p, function () {
          console.log("Success! Bound to port '" + p + "' to handle ACME challenges and redirect to https");
          resolve();
        }).on('error', function (e) {
          console.log("Did not successfully create http server and bind to port '" + p + "':");
          explainError(e);
          process.exit(0);
        });
      }));
    });

    ports.forEach(function (p) {
      if (!(parseInt(p, 10) >= 0)) { console.warn("'" + p + "' doesn't seem to be a valid port number for https"); }
      promises.push(new PromiseA(function (resolve) {
        var server = require('https').createServer(le.httpsOptions, le.middleware(le.app)).listen(p, function () {
          console.log("Success! Serving https on port '" + p + "'");
          resolve();
        }).on('error', function (e) {
          console.log("Did not successfully create https server and bind to port '" + p + "':");
          explainError(e);
          process.exit(0);
        });
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
