"use strict";

var Servers = module.exports;

var http = require("http");
var HttpMiddleware = require("./http-middleware.js");
var HttpsMiddleware = require("./https-middleware.js");
var sni = require("./sni.js");
var cluster = require("cluster");

Servers.create = function(greenlock) {
    var servers = {};
    var _httpServer;
    var _httpsServer;

    function startError(e) {
        explainError(e);
        process.exit(1);
    }

    servers.httpServer = function(defaultApp) {
        if (_httpServer) {
            if (defaultApp) {
                console.error("error: can only call httpServer(app) once");
                process.exit(1);
            }
            return _httpServer;
        }

        if (!defaultApp) {
            defaultApp = require("redirect-https")();
        }
        // HEADERS SENT DEBUG NOTE #1
        // As seen above, it's only possible to create the server once.
        // It always gets the http middleware, it always gets a single default app
        // Therefore it seems impossible to be an http.on('connection', app) problem
        _httpServer = http.createServer(HttpMiddleware.create(greenlock, defaultApp));
        _httpServer.once("error", startError);

        return _httpServer;
    };

    var _middlewareApp;

    servers.http2Server = function(secureOpts, defaultApp) {
        return servers._httpsServer(secureOpts, defaultApp, function(secureOpts, fn) {
            secureOpts.allowHTTP1 = true;
            return require("http2").createSecureServer(secureOpts, fn);
        });
    };
    servers.httpsServer = function(secureOpts, defaultApp) {
        return servers._httpsServer(secureOpts, defaultApp, function(secureOpts, fn) {
            return require("https").createServer(secureOpts, fn);
        });
    };
    servers._httpsServer = function(secureOpts, defaultApp, createSecureServer) {
        if (defaultApp) {
            // TODO guard against being set twice?
            _middlewareApp = defaultApp;
        }

        if (_httpsServer) {
            if (secureOpts && Object.keys(secureOpts).length) {
                throw new Error("Call glx.httpsServer(tlsOptions) before calling glx.serveApp(app)");
            }
            return _httpsServer;
        }

        if (!secureOpts) {
            secureOpts = {};
        }

        _httpsServer = createSecureServer(
            wrapDefaultSniCallback(greenlock, secureOpts),
            HttpsMiddleware.create(greenlock, function(req, res) {
                if (!_middlewareApp) {
                    throw new Error("Set app with `glx.serveApp(app)` or `glx.httpsServer(tlsOptions, app)`");
                }
                _middlewareApp(req, res);
            })
        );
        _httpsServer.once("error", startError);

        return _httpsServer;
    };

    servers.id = function() {
        return (cluster.isWorker && cluster.worker.id) || "0";
    };
    servers.serveApp = function(app) {
        return new Promise(function(resolve, reject) {
            if ("function" !== typeof app) {
                reject(
                    new Error(
                        "glx.serveApp(app) expects a node/express app in the format `function (req, res) { ... }`"
                    )
                );
                return;
            }

            var id = cluster.isWorker && cluster.worker.id;
            var idstr = (id && "#" + id + " ") || "";
            var plainServer = servers.httpServer();
            var plainAddr = "0.0.0.0";
            var plainPort = 80;
            plainServer.listen(plainPort, plainAddr, function() {
                console.info(
                    idstr + "Listening on",
                    plainAddr + ":" + plainPort,
                    "for ACME challenges, and redirecting to HTTPS"
                );

                // TODO fetch greenlock.servername
                _middlewareApp = app || _middlewareApp;
                var secureServer = servers.httpsServer(null, app);
                var secureAddr = "0.0.0.0";
                var securePort = 443;
                secureServer.listen(securePort, secureAddr, function() {
                    console.info(idstr + "Listening on", secureAddr + ":" + securePort, "for secure traffic");

                    plainServer.removeListener("error", startError);
                    secureServer.removeListener("error", startError);
                    resolve();
                });
            });
        });
    };

    return servers;
};

function explainError(e) {
    console.error();
    console.error("Error: " + e.message);
    if ("EACCES" === e.errno) {
        console.error("You don't have prmission to access '" + e.address + ":" + e.port + "'.");
        console.error('You probably need to use "sudo" or "sudo setcap \'cap_net_bind_service=+ep\' $(which node)"');
    } else if ("EADDRINUSE" === e.errno) {
        console.error("'" + e.address + ":" + e.port + "' is already being used by some other program.");
        console.error("You probably need to stop that program or restart your computer.");
    } else {
        console.error(e.code + ": '" + e.address + ":" + e.port + "'");
    }
    console.error();
}

function wrapDefaultSniCallback(greenlock, secureOpts) {
    // I'm not sure yet if the original SNICallback
    // should be called before or after, so I'm just
    // going to delay making that choice until I have the use case
    /*
		if (!secureOpts.SNICallback) {
			secureOpts.SNICallback = function(servername, cb) {
				cb(null, null);
			};
		}
  */
    if (secureOpts.SNICallback) {
        console.warn();
        console.warn("[warning] Ignoring the given tlsOptions.SNICallback function.");
        console.warn();
        console.warn("          We're very open to implementing support for this,");
        console.warn("          we just don't understand the use case yet.");
        console.warn("          Please open an issue to discuss. We'd love to help.");
        console.warn();
    }

    // TODO greenlock.servername for workers
    secureOpts.SNICallback = sni.create(greenlock, secureOpts);
    return secureOpts;
}
