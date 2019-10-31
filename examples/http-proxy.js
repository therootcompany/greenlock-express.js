"use strict";

require("@root/greenlock-express")
	.init(function getConfig() {
		return { package: require("../package.json") };
	})
	.serve(httpsWorker);

function httpsWorker(glx) {
	var proxy = require("http-proxy").createProxyServer({ xfwd: true });

	// we need the raw https server
	var server = glx.httpsServer();

	// catches error events during proxying
	proxy.on("error", function(err, req, res) {
		console.error(err);
		res.statusCode = 500;
		res.end();
		return;
	});

	// We'll proxy websocketts too
	server.on("upgrade", function(req, socket, head) {
		proxy.ws(req, socket, head, {
			ws: true,
			target: "ws://localhost:1443"
		});
	});

	// servers a node app that proxies requests to a localhost
	glx.serveApp(function(req, res) {
		proxy.web(req, res, {
			target: "http://localhost:3000"
		});
	});
}
