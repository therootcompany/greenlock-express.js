"use strict";

var Servers = module.exports;

var http = require("http");
var HttpMiddleware = require("./http-middleware.js");
var HttpsMiddleware = require("./https-middleware.js");
var sni = require("./sni.js");

Servers.create = function(greenlock, opts) {
	var servers = {};
	var _httpServer;
	var _httpsServer;

	function startError(e) {
		explainError(e);
		process.exit(1);
	}

	servers.httpServer = function(defaultApp) {
		if (_httpServer) {
			return _httpServer;
		}

		_httpServer = http.createServer(HttpMiddleware.create(opts.greenlock, defaultApp));
		_httpServer.once("error", startError);

		return _httpServer;
	};

	servers.httpsServer = function(secureOpts, defaultApp) {
		if (_httpsServer) {
			return _httpsServer;
		}

		if (!secureOpts) {
			secureOpts = {};
		}

		_httpsServer = createSecureServer(
			wrapDefaultSniCallback(opts, greenlock, secureOpts),
			HttpsMiddleware.create(greenlock, defaultApp)
		);
		_httpsServer.once("error", startError);

		return _httpsServer;
	};

	servers.serveApp = function(app) {
		return new Promise(function(resolve, reject) {
			if ("function" !== typeof app) {
				reject(new Error("glx.serveApp(app) expects a node/express app in the format `function (req, res) { ... }`"));
				return;
			}

			var plainServer = servers.httpServer(require("redirect-https")());
			var plainAddr = "0.0.0.0";
			var plainPort = 80;
			plainServer.listen(plainPort, plainAddr, function() {
				console.info("Listening on", plainAddr + ":" + plainPort, "for ACME challenges, and redirecting to HTTPS");

				// TODO fetch greenlock.servername
				var secureServer = servers.httpsServer({}, app);
				var secureAddr = "0.0.0.0";
				var securePort = 443;
				secureServer.listen(securePort, secureAddr, function() {
					console.info("Listening on", secureAddr + ":" + securePort, "for secure traffic");

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

function wrapDefaultSniCallback(opts, greenlock, secureOpts) {
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

	secureOpts.SNICallback = sni.create(opts, greenlock, secureOpts);
	return secureOpts;
}

function createSecureServer(secureOpts, fn) {
	var major = process.versions.node.split(".")[0];

	// TODO can we trust earlier versions as well?
	if (major >= 12) {
		secureOpts.allowHTTP1 = true;
		return require("http2").createSecureServer(secureOpts, fn);
	} else {
		return require("https").createServer(secureOpts, fn);
	}
}
