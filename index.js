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
    opts._communityPackageVersion = require('./package.json').version;
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

  function _createPlain(plainPort) {
    if (!plainPort) { plainPort = 80; }

    var parts = String(plainPort).split(':');
    var p = parts.pop();
    var addr = parts.join(':').replace(/^\[/, '').replace(/\]$/, '');
    var args = [];
    var httpType;
    var server;
    var validHttpPort = (parseInt(p, 10) >= 0);

    if (addr) { args[1] = addr; }
    if (!validHttpPort && !/(\/)|(\\\\)/.test(p)) {
      console.warn("'" + p + "' doesn't seem to be a valid port number, socket path, or pipe");
    }

    server = require('http').createServer(
      greenlock.middleware.sanitizeHost(greenlock.middleware(require('redirect-https')()))
    );
    httpType = 'http';

    return { server: server, listen: function () { return new PromiseA(function (resolve, reject) {
      args[0] = p;
      args.push(function () {
        if (!greenlock.servername) {
          if (Array.isArray(greenlock.approvedDomains) && greenlock.approvedDomains.length) {
            greenlock.servername = greenlock.approvedDomains[0];
          }
          if (Array.isArray(greenlock.approveDomains) && greenlock.approvedDomains.length) {
            greenlock.servername = greenlock.approvedDomains[0];
          }
        }
        if (!greenlock.servername) {
          resolve(null);
          return;
        }
        return greenlock.check({ domains: [ greenlock.servername ] }).then(function (certs) {
          if (certs) {
            return {
              key: Buffer.from(certs.privkey, 'ascii')
            , cert: Buffer.from(certs.cert + '\r\n' + certs.chain, 'ascii')
            };
          }
          console.info("Fetching certificate for '%s' to use as default for HTTPS server...", greenlock.servername);
          return new PromiseA(function (resolve, reject) {
            // using SNICallback because all options will be set
            greenlock.tlsOptions.SNICallback(greenlock.servername, function (err/*, secureContext*/) {
              if (err) { reject(err); return; }
              return greenlock.check({ domains: [ greenlock.servername ] }).then(function (certs) {
                resolve({
                  key: Buffer.from(certs.privkey, 'ascii')
                , cert: Buffer.from(certs.cert + '\r\n' + certs.chain, 'ascii')
                });
              }).catch(reject);
            });
          });
        }).then(resolve).catch(reject);
      });
      server.listen.apply(server, args).on('error', function (e) {
        if (server.listenerCount('error') < 2) {
          console.warn("Did not successfully create http server and bind to port '" + p + "':");
          explainError(e);
          process.exit(41);
        }
      });
    }); } };
  }

  function _create(port) {
    if (!port) { port = 443; }

    var parts = String(port).split(':');
    var p = parts.pop();
    var addr = parts.join(':').replace(/^\[/, '').replace(/\]$/, '');
    var args = [];
    var httpType;
    var server;
    var validHttpPort = (parseInt(p, 10) >= 0);

    if (addr) { args[1] = addr; }
    if (!validHttpPort && !/(\/)|(\\\\)/.test(p)) {
      console.warn("'" + p + "' doesn't seem to be a valid port number, socket path, or pipe");
    }

    var https;
    try {
      https = require('spdy');
      greenlock.tlsOptions.spdy = { protocols: [ 'h2', 'http/1.1' ], plain: false };
      httpType = 'http2 (spdy/h2)';
    } catch(e) {
      https = require('https');
      httpType = 'https';
    }
    var sniCallback = greenlock.tlsOptions.SNICallback;
    greenlock.tlsOptions.SNICallback = function (domain, cb) {
      sniCallback(domain, function (err, context) {
        cb(err, context);
        if (!context || server._hasDefaultSecureContext) {
          return;
        }
        return greenlock.check({ domains: [ domain ] }).then(function (certs) {
          // ignore the case that check doesn't have all the right args here
          // to get the same certs that it just got (eventually the right ones will come in)
          if (!certs) { return; }
          if (server.setSecureContext) {
            // only available in node v11.0+
            server.setSecureContext({
              key: Buffer.from(certs.privkey, 'ascii')
            , cert: Buffer.from(certs.cert + '\r\n' + certs.chain, 'ascii')
            });
            console.info("Using '%s' as default certificate", domain);
          } else {
            console.info("Setting default certificates dynamically requires node v11.0+. Skipping.");
          }
          server._hasDefaultSecureContext = true;
        }).catch(function (/*e*/) {
          // this may be that the test.example.com was requested, but it's listed
          // on the cert for demo.example.com which is in its own directory, not the other
          //console.warn("Unusual error: couldn't get newly authorized certificate:");
          //console.warn(e.message);
        });
      });
    };
    if (greenlock.tlsOptions.cert) {
      server._hasDefaultSecureContext = true;
      if (greenlock.tlsOptions.cert.toString('ascii').split("BEGIN").length < 3) {
        console.warn("Invalid certificate file. 'tlsOptions.cert' should contain cert.pem (certificate file) *and* chain.pem (intermediate certificates) seperated by an extra newline (CRLF)");
      }
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

    return { server: server, listen: function () { return new PromiseA(function (resolve) {
      args[0] = p;
      args.push(function () { resolve(/*server*/); });
      server.listen.apply(server, args).on('error', function (e) {
        if (server.listenerCount('error') < 2) {
          console.warn("Did not successfully create http server and bind to port '" + p + "':");
          explainError(e);
          process.exit(41);
        }
      });
    }); } };
  }

  // NOTE: 'greenlock' is just 'opts' renamed
  var greenlock = require('greenlock').create(opts);

  if (!opts.app) {
    opts.app = function (req, res) {
      res.end("Hello, World!\nWith Love,\nGreenlock for Express.js");
    };
  }

  opts.listen = function (plainPort, port, fnPlain, fn) {
    var server;
    var plainServer;

    // If there is only one handler for the `listening` (i.e. TCP bound) event
    // then we want to use it as HTTPS (backwards compat)
    if (!fn) {
      fn = fnPlain;
      fnPlain = null;
    }

    var obj1 = _createPlain(plainPort, true);
    var obj2 = _create(port, false);

    plainServer = obj1.server;
    server = obj2.server;

    server.then = obj1.listen().then(function (tlsOptions) {
      if (tlsOptions) {
        if (server.setSecureContext) {
          // only available in node v11.0+
          server.setSecureContext(tlsOptions);
          console.info("Using '%s' as default certificate", greenlock.servername);
        } else {
          console.info("Setting default certificates dynamically requires node v11.0+. Skipping.");
        }
        server._hasDefaultSecureContext = true;
      }
      return obj2.listen().then(function () {
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
    }).then;

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
