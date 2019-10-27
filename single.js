"use strict";

require("./main.js");

var Single = module.exports;
var Servers = require("./servers.js");
var Greenlock = require("@root/greenlock");

Single.create = function(opts) {
	var greenlock = Greenlock.create(opts);
	var servers = Servers.create(greenlock, opts);
	//var master = Master.create(opts);

	var single = {
		worker: function(fn) {
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
