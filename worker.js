"use strict";

var Worker = module.exports;

Worker.create = function(opts) {
	var greenlock = {
		// rename presentChallenge?
		getAcmeHttp01ChallengeResponse: presentChallenge,
		notify: notifyMaster,
		get: greenlockRenew
	};

	var worker = {
		worker: function(fn) {
			var servers = require("./servers.js").create(greenlock, opts);
			fn(servers);
			return worker;
		},
		master: function() {
			// ignore
			return worker;
		}
	};
	return worker;
};

function greenlockRenew(args) {
	return request("renew", {
		servername: args.servername
	});
}

function presentChallenge(args) {
	return request("challenge-response", {
		servername: args.servername,
		token: args.token
	});
}

function request(typename, msg) {
	return new Promise(function(resolve, reject) {
		var rnd = Math.random()
			.slice(2)
			.toString(16);
		var id = "greenlock:" + rnd;
		var timeout;

		function getResponse(msg) {
			if (msg.id !== id) {
				return;
			}
			clearTimeout(timeout);
			resolve(msg);
		}

		process.on("message", getResponse);
		msg.id = msg;
		msg.type = typename;
		process.send(msg);

		timeout = setTimeout(function() {
			process.removeListener("message", getResponse);
			reject(new Error("process message timeout"));
		}, 30 * 1000);
	});
}

function notifyMaster(ev, args) {
	process.on("message", {
		type: "notification",
		event: ev,
		parameters: args
	});
}
