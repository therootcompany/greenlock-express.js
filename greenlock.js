"use strict";

module.exports.create = function(opts) {
	opts = parsePackage(opts);
	opts.packageAgent = addGreenlockAgent(opts);

	var Greenlock = require("@root/greenlock");
	var greenlock = Greenlock.create(opts);

	// TODO move to greenlock proper
	greenlock.getAcmeHttp01ChallengeResponse = function(opts) {
		// TODO some sort of caching to prevent database hits?
		return greenlock
			._config({ servername: opts.servername })
			.then(function(site) {
				if (!site) {
					return null;
				}

				// Hmm... this _should_ be impossible
				if (!site.challenges || !site.challenges["http-01"]) {
					return null;
				}

				return Greenlock._loadChallenge(site.challenges, "http-01");
			})
			.then(function(plugin) {
				return plugin
					.get({
						challenge: {
							type: opts.type,
							//hostname: opts.servername,
							altname: opts.servername,
							identifier: { value: opts.servername },
							token: opts.token
						}
					})
					.then(function(result) {
						var keyAuth;
						if (result) {
							// backwards compat that shouldn't be dropped
							// because new v3 modules had to do this to be
							// backwards compatible with Greenlock v2.7 at
							// the time.
							if (result.challenge) {
								result = challenge;
							}
							keyAuth = result.keyAuthorization;
						}
						return {
							keyAuthorization: keyAuth
						};
					});
			});
	};

	return greenlock;
};

function addGreenlockAgent(opts) {
	// Add greenlock as part of Agent, unless this is greenlock
	var packageAgent = opts.packageAgent || "";
	if (!/greenlock(-express|-pro)?/i.test(packageAgent)) {
		var pkg = require("./package.json");
		packageAgent += " Greenlock_Express/" + pkg.version;
	}

	return packageAgent.trim();
}

// ex: John Doe <john@example.com> (https://john.doe)
var looseEmailRe = /.*([^'" <>:;`]+@[^'" <>:;`]+\.[^'" <>:;`]+).*/;
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
