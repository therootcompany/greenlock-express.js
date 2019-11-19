"use strict";

require("./main.js");

var Single = module.exports;
var Servers = require("./servers.js");

Single.create = function(opts) {
    var greenlock = require("./greenlock-shim.js").create(opts);

    var servers = Servers.create(greenlock);

    var single = {
        ready: function(fn) {
            fn(servers);
            return single;
        },
        master: function(/*fn*/) {
            // ignore
            //fn(master);
            return single;
        },
        serve: function(fn) {
            // keeping backwards compat
            if (1 === fn.length) {
                single.ready(fn);
                return;
            }
            // serving the app, right away
            single.ready(function(glx) {
                glx.serveApp(fn);
            });
        }
    };
    return single;
};
