"use strict";

var Worker = module.exports;
// *very* generous, but well below the http norm of 120
var messageTimeout = 30 * 1000;
var msgPrefix = "greenlock:";

Worker.create = function() {
    var greenlock = {};
    ["getAcmeHttp01ChallengeResponse", "get", "notify", "_notify"].forEach(function(k) {
        greenlock[k] = function(args) {
            return rpc(k, args);
        };
    });

    var worker = {
        ready: function(fn) {
            var servers = require("./servers.js").create(greenlock);
            fn(servers);
            return worker;
        },
        master: function() {
            // ignore
            return worker;
        },
        serve: function(fn) {
            // keeping backwards compat
            if (1 === fn.length) {
                worker.ready(fn);
                return;
            }
            // serving the express app, right away
            worker.ready(function(glx) {
                glx.serveApp(fn);
            });
        }
    };
    return worker;
};

function rpc(funcname, msg) {
    return new Promise(function(resolve, reject) {
        var rnd = Math.random()
            .toString()
            .slice(2)
            .toString(16);
        var id = msgPrefix + rnd;
        var timeout;

        function getResponse(msg) {
            if (msg._id !== id) {
                return;
            }
            process.removeListener("message", getResponse);
            clearTimeout(timeout);
            resolve(msg._result);
        }

        // TODO keep a single listener than just responds
        // via a collection of callbacks? or leave as is?
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
