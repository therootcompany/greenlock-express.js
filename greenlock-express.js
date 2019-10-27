"use strict";

require("./lib/compat");

// Greenlock Express
var GLE = module.exports;

// opts.approveDomains(options, certs, cb)
GLE.create = function(opts) {
	if (!opts) {
		opts = {};
	}

	// just for ironic humor
	["cloudnative", "cloudscale", "webscale", "distributed", "blockchain"].forEach(function(k) {
		if (opts[k]) {
			opts.cluster = true;
		}
	});

	// we want to be minimal, and only load the code that's necessary to load
	if (opts.cluster) {
		if (require("cluster").isMaster) {
			return require("./master.js").create(opts);
		}
		return require("./worker.js").create(opts);
	}
	return require("./single.js").create(opts);
};
