'use strict';

var PromiseA;
try {
  PromiseA = require('bluebird');
} catch(e) {
  PromiseA = global.Promise;
}

// opts.approveDomains(options, certs, cb)
module.exports.create = function (opts) {
  // accept all defaults for greenlock.challenges, greenlock.store, greenlock.middleware
  if (!opts._communityPackage) {
    opts._communityPackage = 'greenlock-express.js';
  }

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

  function _listenHttp(plainPort) {
    if (!plainPort) { plainPort = 80; }
    var p = plainPort;
    var validHttpPort = (parseInt(p, 10) >= 0);
    if (!validHttpPort) { console.warn("'" + p + "' doesn't seem to be a valid port number for http"); }
    var plainServer = require('http').createServer(
      greenlock.middleware.sanitizeHost(greenlock.middleware(require('redirect-https')()))
    );
    var promise = new PromiseA(function (resolve) {
      plainServer.listen(p, function () {
        console.log("Success! Bound to port '" + p + "' to handle ACME challenges and redirect to https");
        resolve();
      }).on('error', function (e) {
        console.log("Did not successfully create http server and bind to port '" + p + "':");
        explainError(e);
        process.exit(0);
      });
    });
    promise.server = plainServer;
    return promise;
  }

  function _listenHttps(port) {
    if (!port) { port = 443; }

    var p = port;
    var validHttpsPort = (parseInt(p, 10) >= 0);
    if (!validHttpsPort) { console.warn("'" + p + "' doesn't seem to be a valid port number for https"); }
    var https;
    try {
      https = require('spdy');
      greenlock.tlsOptions.spdy = { protocols: [ 'h2', 'http/1.1' ], plain: false };
    } catch(e) {
      https = require('https');
    }
    var server = https.createServer(
      greenlock.tlsOptions
    , greenlock.middleware.sanitizeHost(function (req, res) {
        try {
          greenlock.app(req, res);
        } catch(e) {
          console.error("[error] [greenlock.app] Your HTTP handler had an uncaught error:");
          console.error(e);
        }
      })
    );
    var promise = new PromiseA(function (resolve) {
      server.listen(p, function () {
        console.log("Success! Serving https on port '" + p + "'");
        resolve(server);
      }).on('error', function (e) {
        console.log("Did not successfully create https server and bind to port '" + p + "':");
        explainError(e);
        process.exit(0);
      });
    });
    promise.server = server;
    return promise;
  }

  var greenlock = require('greenlock').create(opts);

  opts.app = opts.app || function (req, res) {
    res.end("Hello, World!\nWith Love,\nGreenlock for Express.js");
  };

  opts.listen = function (plainPort, port) {
    var promises = [];
    promises.push(_listenHttp(plainPort));
    promises.push(_listenHttps(port));
  };


  return greenlock;
};
