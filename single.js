"use strict";

require("./main.js");

var Single = module.exports;
var Servers = require("./servers.js");

Single.create = function(opts) {
	var greenlock = require("./greenlock.js").create(opts);

	var servers = Servers.create(greenlock, opts);

	var single = {
		serve: function(fn) {
			fn(servers);
			return single;
		},
		master: function(/*fn*/) {
			// ignore
			//fn(master);
			return single;
		}
	};
	return single;
};
