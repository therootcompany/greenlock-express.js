"use strict";

var Greenlock = require("./");
var greenlockOptions = {
	cluster: false,

	maintainerEmail: "greenlock-test@rootprojects.org",
	servername: "foo-gl.test.utahrust.com",
	serverId: "bowie.local"

	/*
  manager: {
    module: "greenlock-manager-sequelize",
    dbUrl: "postgres://foo@bar:baz/quux"
  }
  */
};

Greenlock.create(greenlockOptions)
	.worker(function(glx) {
		console.info();
		console.info("Hello from worker");

		glx.serveApp(function(req, res) {
			res.end("Hello, Encrypted World!");
		});
	})
	.master(function() {
		console.log("Hello from master");
	});
