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
		//serverId: "bowie.local",
		//servername: "foo-gl.test.utahrust.com",
		staging: true,

		challenges: {
			"dns-01": {
				module: "acme-dns-01-digitalocean"
			}
		},

    notify: function (ev, params) {
      console.log(ev, params);
    }
	};
	return config;
}

function worker(glx) {
	console.info();
	console.info("Hello from worker");

	glx.serveApp(function(req, res) {
		res.end("Hello, Encrypted World!");
	});
}
