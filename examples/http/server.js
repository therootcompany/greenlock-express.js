"use strict";

var pkg = require("../../package.json");

// The WRONG way:
//var http = require('http');
//var httpServer = https.createSecureServer(redirectToHttps);
//
// Why is that wrong?
// Greenlock needs to change some low-level http and https options.
// Use glx.httpServer(redirectToHttps) instead.

function httpsWorker(glx) {
	//
	// HTTP can only be used for ACME HTTP-01 Challenges
	// (and it is not required for DNS-01 challenges)
	//

	// Get the raw http server:
	var httpServer = glx.httpServer(function(req, res) {
		res.statusCode = 301;
		res.setHeader("Location", "https://" + req.headers.host + req.path);
		res.end("Insecure connections are not allowed. Redirecting...");
	});

	httpServer.listen(80, "0.0.0.0", function() {
		console.info("Listening on ", httpServer.address());
	});
}

//require("greenlock-express")
require("../../")
	.init(function getConfig() {
		// Greenlock Config

		return {
			package: { name: "plain-http-example", version: pkg.version },
			maintainerEmail: "jon@example.com",
			cluster: false
		};
	})
	.serve(httpsWorker);
