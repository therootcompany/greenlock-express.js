"use strict";

var pkg = require("../../package.json");

// The WRONG way:
//var http2 = require('http2');
//var http2Server = https.createSecureServer(tlsOptions, app);
//
// Why is that wrong?
// Greenlock needs to change some low-level http and https options.
// Use glx.httpsServer(tlsOptions, app) instead.

function httpsWorker(glx) {
	//
	// HTTP2 is the default httpsServer for node v12+
	// (HTTPS/1.1 is used for node <= v11)
	//

	// Get the raw http2 server:
	var http2Server = glx.httpsServer(function(req, res) {
		res.end("Hello, Encrypted World!");
	});

	http2Server.listen(443, "0.0.0.0", function() {
		console.info("Listening on ", http2Server.address());
	});

	// Note:
	// You must ALSO listen on port 80 for ACME HTTP-01 Challenges
	// (the ACME and http->https middleware are loaded by glx.httpServer)
	var httpServer = glx.httpServer();
	httpServer.listen(80, "0.0.0.0", function() {
		console.info("Listening on ", httpServer.address());
	});
}

//require("greenlock-express")
require("../../")
	.init(function getConfig() {
		// Greenlock Config

		return {
			package: { name: "http2-example", version: pkg.version },
			maintainerEmail: "jon@example.com",
			cluster: false
		};
	})
	.serve(httpsWorker);
