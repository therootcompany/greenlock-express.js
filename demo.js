"use strict";

require("./")
	.init(initialize)
	.serve(worker)
	.master(function() {
		console.log("Hello from master");
	});

function initialize() {
	var pkg = require("./package.json");
	var config = {
		package: pkg,
		staging: true,
		cluster: true,

		challenges: {
			"dns-01": {
				module: "acme-dns-01-digitalocean"
			}
		},

		notify: function(ev, params) {
			console.log(ev, params);
		}
	};
	return config;
}

function worker(glx) {
	console.info();
	console.info("Hello from worker #" + glx.id());

	glx.serveApp(function(req, res) {
		res.end("Hello, Encrypted World!");
	});
}
