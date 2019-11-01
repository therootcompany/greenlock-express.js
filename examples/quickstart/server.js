"use strict";

function httpsWorker(glx) {
	// This can be a node http app (shown),
	// an Express app, or Hapi, Koa, Rill, etc
	var app = function(req, res) {
		res.end("Hello, Encrypted World!");
	};

	// Serves on 80 and 443
	// Get's SSL certificates magically!
	glx.serveApp(app);
}

var pkg = require("../../package.json");
//require("greenlock-express")
require("../../")
	.init(function getConfig() {
		// Greenlock Config

		return {
			// Package name+version is used for ACME client user agent
			package: { name: "websocket-example", version: pkg.version },

			// Maintainer email is the contact for critical bug and security notices
			maintainerEmail: "jon@example.com",

			// Change to true when you're ready to make your app cloud-scale
			cluster: false
		};
	})
	.serve(httpsWorker);
