"use strict";

function httpsWorker(glx) {
	// we need the raw https server
	var server = glx.httpsServer();
	var proxy = require("http-proxy").createProxyServer({ xfwd: true });

	// catches error events during proxying
	proxy.on("error", function(err, req, res) {
		console.error(err);
		res.statusCode = 500;
		res.end();
		return;
	});

	// We'll proxy websockets too
	server.on("upgrade", function(req, socket, head) {
		proxy.ws(req, socket, head, {
			ws: true,
			target: "ws://localhost:3000"
		});
	});

	// servers a node app that proxies requests to a localhost
	glx.serveApp(function(req, res) {
		proxy.web(req, res, {
			target: "http://localhost:3000"
		});
	});
}

var pkg = require("../../package.json");
//require("greenlock-express")
require("../../")
	.init(function getConfig() {
		// Greenlock Config

		return {
			package: { name: "http-proxy-example", version: pkg.version },
			maintainerEmail: "jon@example.com",
			cluster: false
		};
	})
	.serve(httpsWorker);
