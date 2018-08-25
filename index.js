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

  function _listen(plainPort, plain) {
    if (!plainPort) { plainPort = 80; }

    var parts = String(plainPort).split(':');
    var p = parts.pop();
    var addr = parts.join(':').replace(/^\[/, '').replace(/\]$/, '');
    var args = [];
    var httpType;
    var server;
    var validHttpPort = (parseInt(p, 10) >= 0);

    function tryPlain() {
      server = require('http').createServer(
        greenlock.middleware.sanitizeHost(greenlock.middleware(require('redirect-https')()))
      );
      httpType = 'http';
    }

    function trySecure() {
      var https;
      try {
        https = require('spdy');
        greenlock.tlsOptions.spdy = { protocols: [ 'h2', 'http/1.1' ], plain: false };
        httpType = 'http2 (spdy/h2)';
      } catch(e) {
        https = require('https');
        httpType = 'https';
      }
      server = https.createServer(
        greenlock.tlsOptions
      , greenlock.middleware.sanitizeHost(function (req, res) {
          try {
            greenlock.app(req, res);
          } catch(e) {
            console.error("[error] [greenlock.app] Your HTTP handler had an uncaught error:");
            console.error(e);
            try {
              res.statusCode = 500;
              res.end("Internal Server Error: [Greenlock] HTTP exception logged for user-provided handler.");
            } catch(e) {
              // ignore
              // (headers may have already been sent, etc)
            }
          }
        })
      );
      server.type = httpType;
    }

    if (addr) { args[1] = addr; }
    if (!validHttpPort && !/(\/)|(\\\\)/.test(p)) {
      console.warn("'" + p + "' doesn't seem to be a valid port number, socket path, or pipe");
    }
    if (plain) { tryPlain(); } else { trySecure(); }

    var promise = new PromiseA(function (resolve) {
      args[0] = p;
      args.push(function () { resolve(server); });
      server.listen.apply(server, args).on('error', function (e) {
        if (server.listenerCount('error') < 2) {
          console.warn("Did not successfully create http server and bind to port '" + p + "':");
          explainError(e);
          process.exit(41);
        }
      });
    });

    promise.server = server;
    return promise;
  }

  // NOTE: 'greenlock' is just 'opts' renamed
  var greenlock = require('greenlock').create(opts);

  if (!opts.app) {
    opts.app = function (req, res) {
      res.end("Hello, World!\nWith Love,\nGreenlock for Express.js");
    };
  }

  opts.listen = function (plainPort, port, fnPlain, fn) {
    var promises = [];
    var server;
    var plainServer;

    if (!fn) {
      fn = fnPlain;
      fnPlain = null;
    }

    promises.push(_listen(plainPort, true));
    promises.push(_listen(port, false));

    server = promises[1].server;
    plainServer = promises[0].server;

    PromiseA.all(promises).then(function () {
      // Report plain http status
      if ('function' === typeof fnPlain) {
        fnPlain.apply(plainServer);
      } else if (!fn && !plainServer.listenerCount('listening') && !server.listenerCount('listening')) {
        console.info('[:' + (plainServer.address().port || plainServer.address())
          + "] Handling ACME challenges and redirecting to " + server.type);
      }

      // Report h2/https status
      if ('function' === typeof fn) {
        fn.apply(server);
      } else if (!server.listenerCount('listening')) {
        console.info('[:' + (server.address().port || server.address()) + "] Serving " + server.type);
      }
    });

    server.unencrypted = plainServer;
    return server;
  };
  opts.middleware.acme = function (opts) {
    return greenlock.middleware.sanitizeHost(greenlock.middleware(require('redirect-https')(opts)));
  };
  opts.middleware.secure = function (app) {
    return greenlock.middleware.sanitizeHost(app);
  };

  return greenlock;
};
