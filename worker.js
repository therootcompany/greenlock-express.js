"use strict";

var Worker = module.exports;
// *very* generous, but well below the http norm of 120
var messageTimeout = 30 * 1000;
var msgPrefix = 'greenlock:';

Worker.create = function() {
	var greenlock = {};
	["getAcmeHttp01ChallengeResponse", "renew", "notify"].forEach(function(k) {
		greenlock[k] = function(args) {
			return rpc(k, args);
		};
	});

	var worker = {
		serve: function(fn) {
			var servers = require("./servers.js").create(greenlock);
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

function rpc(funcname, msg) {
	return new Promise(function(resolve, reject) {
		var rnd = Math.random()
			.slice(2)
			.toString(16);
		var id = msgPrefix + rnd;
		var timeout;

		function getResponse(msg) {
			if (msg._id !== id) {
				return;
			}
			clearTimeout(timeout);
			resolve(msg._result);
		}

		process.on("message", getResponse);
		process.send({
			_id: id,
			_funcname: funcname,
			_input: msg
		});

		timeout = setTimeout(function() {
			process.removeListener("message", getResponse);
			reject(new Error("worker rpc request timeout"));
		}, messageTimeout);
	});
}
