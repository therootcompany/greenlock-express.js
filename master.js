"use strict";

require("./main.js");

var Master = module.exports;

var cluster = require("cluster");
var os = require("os");

Master.create = function(opts) {
	var workers = [];
	var resolveCb;
	var readyCb;
	var _kicked = false;

	var greenlock = require("./greenlock.js").create(opts);

	var ready = new Promise(function(resolve) {
		resolveCb = resolve;
	}).then(function(fn) {
		readyCb = fn;
	});

	function kickoff() {
		if (_kicked) {
			return;
		}
		_kicked = true;

		console.log("TODO: start the workers and such...");
		// handle messages from workers
		workers.push(null);
		ready.then(function(fn) {
			// not sure what this API should be yet
			fn({
				//workers: workers.slice(0)
			});
		});
	}

	var master = {
		worker: function() {
			kickoff();
			return master;
		},
		master: function(fn) {
			if (readyCb) {
				throw new Error("can't call master twice");
			}
			kickoff();
			resolveCb(fn);
			return master;
		}
	};
};

// opts.approveDomains(options, certs, cb)
GLE.create = function(opts) {
	GLE._spawnWorkers(opts);

	gl.tlsOptions = {};

	return master;
};

function range(n) {
	return new Array(n).join(",").split(",");
}

Master._spawnWorkers = function(opts) {
	var numCpus = parseInt(process.env.NUMBER_OF_PROCESSORS, 10) || os.cpus().length;

	var numWorkers = parseInt(opts.numWorkers, 10);
	if (!numWorkers) {
		if (numCpus <= 2) {
			numWorkers = numCpus;
		} else {
			numWorkers = numCpus - 1;
		}
	}

	return range(numWorkers).map(function() {
		return cluster.fork();
	});
};
