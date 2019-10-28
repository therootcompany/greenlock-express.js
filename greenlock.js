"use strict";

module.exports.create = function(opts) {
	opts = parsePackage(opts);
	opts.packageAgent = addGreenlockAgent(opts);

	var Greenlock = require("@root/greenlock");
	var greenlock = Greenlock.create(opts);

	// TODO move to greenlock proper
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

function addGreenlockAgent(opts) {
	// Add greenlock as part of Agent, unless this is greenlock
	if (!/^greenlock(-express|-pro)?/.test(opts.packageAgent)) {
		var pkg = require("./package.json");
		var packageAgent = pkg.name + "/" + pkg.version;
		opts.packageAgent += " " + packageAgent;
	}

	return opts.packageAgent;
}

// ex: John Doe <john@example.com> (https://john.doe)
var looseEmailRe = /.* <([^'" <>:;`]+@[^'" <>:;`]+\.[^'" <>:;`]+)> .*/;
function parsePackage(opts) {
	// 'package' is sometimes a reserved word
	var pkg = opts.package || opts.pkg;
	if (!pkg) {
		return opts;
	}

	if (!opts.packageAgent) {
		var err = "missing `package.THING`, which is used for the ACME client user agent string";
		if (!pkg.name) {
			throw new Error(err.replace("THING", "name"));
		}
		if (!pkg.version) {
			throw new Error(err.replace("THING", "version"));
		}
		opts.packageAgent = pkg.name + "/" + pkg.version;
	}

	if (!opts.maintainerEmail) {
		try {
			opts.maintainerEmail = pkg.author.email || pkg.author.match(looseEmailRe)[1];
		} catch (e) {}
	}
	if (!opts.maintainerEmail) {
		throw new Error("missing or malformed `package.author`, which is used as the contact for support notices");
	}
	opts.package = undefined;

	return opts;
}
