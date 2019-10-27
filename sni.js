"use strict";

var sni = module.exports;
var tls = require("tls");
var servernameRe = /^[a-z0-9\.\-]+$/i;

// a nice, round, irrational number - about every 6¼ hours
var refreshOffset = Math.round(Math.PI * 2 * (60 * 60 * 1000));
// and another, about 15 minutes
var refreshStagger = Math.round(Math.PI * 5 * (60 * 1000));
// and another, about 30 seconds
var smallStagger = Math.round(Math.PI * (30 * 1000));

//secureOpts.SNICallback = sni.create(opts, greenlock, secureOpts);
sni.create = function(opts, greenlock, secureOpts) {
	var _cache = {};
	var defaultServername = opts.servername || greenlock.servername;

	if (secureOpts.cert) {
		// Note: it's fine if greenlock.servername is undefined,
		// but if the caller wants this to auto-renew, they should define it
		_cache[defaultServername] = {
			refreshAt: 0,
			secureContext: tls.createSecureContext(secureOpts)
		};
	}

	return getSecureContext;

	function notify(ev, args) {
		try {
			// TODO _notify() or notify()?
			(opts.notify || greenlock.notify || greenlock._notify)(ev, args);
		} catch (e) {
			console.error(e);
			console.error(ev, args);
		}
	}

	function getSecureContext(servername, cb) {
		//console.log("debug sni", servername);
		if ("string" !== typeof servername) {
			// this will never happen... right? but stranger things have...
			console.error("[sanity fail] non-string servername:", servername);
			cb(new Error("invalid servername"), null);
			return;
		}

		var secureContext = getCachedContext(servername);
		if (secureContext) {
			//console.log("debug sni got cached context", servername, getCachedMeta(servername));
			cb(null, secureContext);
			return;
		}

		getFreshContext(servername)
			.then(function(secureContext) {
				if (secureContext) {
					//console.log("debug sni got fresh context", servername, getCachedMeta(servername));
					cb(null, secureContext);
					return;
				}
				// Note: this does not replace tlsSocket.setSecureContext()
				// as it only works when SNI has been sent
				//console.log("debug sni got default context", servername, getCachedMeta(servername));
				cb(null, getDefaultContext());
			})
			.catch(function(err) {
				if (!err.context) {
					err.context = "sni_callback";
				}
				notify("error", err);
				//console.log("debug sni error", servername, err);
				cb(err);
			});
	}

	function getCachedMeta(servername) {
		var meta = _cache[servername];
		if (!meta) {
			if (!_cache[wildname(servername)]) {
				return null;
			}
		}
		return meta;
	}

	function getCachedContext(servername) {
		var meta = getCachedMeta(servername);
		if (!meta) {
			return null;
		}

		// always renew in background
		if (!meta.refreshAt || Date.now() >= meta.refreshAt) {
			getFreshContext(servername).catch(function(e) {
				if (!e.context) {
					e.context = "sni_background_refresh";
				}
				notify("error", e);
			});
		}

		// under normal circumstances this would never be expired
		// and, if it is expired, something is so wrong it's probably
		// not worth wating for the renewal - it has probably failed
		return meta.secureContext;
	}

	function getFreshContext(servername) {
		var meta = getCachedMeta(servername);
		if (!meta && !validServername(servername)) {
			return Promise.resolve(null);
		}

		if (meta) {
			// prevent stampedes
			meta.refreshAt = Date.now() + randomRefreshOffset();
		}

		// TODO greenlock.get({ servername: servername })
		// TODO don't get unknown certs at all, rely on auto-updates from greenlock
		// Note: greenlock.renew() will return an existing fresh cert or issue a new one
		return greenlock.renew({ servername: servername }).then(function(matches) {
			console.log("debug matches", matches);
			var meta = getCachedMeta(servername);
			if (!meta) {
				meta = _cache[servername] = { secureContext: {} };
			}
			// prevent from being punked by bot trolls
			meta.refreshAt = Date.now() + smallStagger;

			// nothing to do
			if (!matches.length) {
				return null;
			}

			// we only care about the first one
			var pems = matches[0].pems;
			var site = matches[0].site;
			var match = matches[0];
			if (!pems || !pems.cert) {
				// nothing to do
				// (and the error should have been reported already)
				return null;
			}

			meta = {
				refreshAt: Date.now() + randomRefreshOffset(),
				secureContext: tls.createSecureContext({
					// TODO support passphrase-protected privkeys
					key: pems.privkey,
					cert: pems.cert + "\n" + pems.chain + "\n"
				})
			};

			// copy this same object into every place
			[match.altnames || site.altnames || [match.subject || site.subject]].forEach(function(altname) {
				_cache[altname] = meta;
			});
		});
	}

	function getDefaultContext() {
		return getCachedContext(defaultServername);
	}
};

// whenever we need to know when to refresh next
function randomRefreshOffset() {
	var stagger = Math.round(refreshStagger / 2) - Math.round(Math.random() * refreshStagger);
	return refreshOffset + stagger;
}

function validServername(servername) {
	// format and (lightly) sanitize sni so that users can be naive
	// and not have to worry about SQL injection or fs discovery

	servername = (servername || "").toLowerCase();
	// hostname labels allow a-z, 0-9, -, and are separated by dots
	// _ is sometimes allowed, but not as a "hostname", and not by Let's Encrypt ACME
	// REGEX // https://www.codeproject.com/Questions/1063023/alphanumeric-validation-javascript-without-regex
	return servernameRe.test(servername) && -1 === servername.indexOf("..");
}

function wildname(servername) {
	return (
		"*." +
		servername
			.split(".")
			.slice(1)
			.join(".")
	);
}
