"use strict";

var pkg = require("./package.json");

module.exports.create = function(opts) {
	var Greenlock = require("@root/greenlock");
	var packageAgent = pkg.name + "/" + pkg.version;
	if ("string" === typeof opts.packageAgent) {
		opts.packageAgent += " ";
	} else {
		opts.packageAgent = "";
	}
	opts.packageAgent += packageAgent;

	var greenlock = Greenlock.create(opts);
	greenlock.getAcmeHttp01ChallengeResponse = function(opts) {
		return greenlock.find({ servername: opts.servername }).then(function(sites) {
			if (!sites.length) {
				return null;
			}
			var site = sites[0];
			if (!site.challenges || !site.challenges["http-01"]) {
				return null;
			}

			var plugin;
			try {
				plugin = require(site.challenges["http-01"].module);
				plugin = plugin.create(site.challenges["http-01"]);
			} catch (e) {
				console.error("error getting acme http-01 plugin");
				console.error(e);
				return null;
			}

			return plugin.get(opts).then(function(result) {
				// TODO is this the right way?
				var ch = (result && result.challenge) || result || {};
				return {
					keyAuthorization: ch.keyAuthorization
				};
			});
		});
	};

	return greenlock;
};
