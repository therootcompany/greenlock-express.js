"use strict";

require("./lib/compat");
var cluster = require("cluster");

// Greenlock Express
var GLE = module.exports;

// Node's cluster is awesome, because it encourages writing scalable services.
//
// The point of this provide an API that is consistent between single-process
// and multi-process services so that beginners can more easily take advantage
// of what cluster has to offer.
//
// This API provides just enough abstraction to make it easy, but leaves just
// enough hoopla so that there's not a large gap in understanding what happens
// under the hood. That's the hope, anyway.

GLE.init = function(fn) {
    // See https://git.coolaj86.com/coolaj86/greenlock-express.js/issues/80
    if (fn && false !== fn.cluster && cluster.isWorker) {
        // ignore the init function and launch the worker
        return require("./worker.js").create();
    }

    var opts;
    if ("function" === typeof fn) {
        opts = fn();
    } else if ("object" === typeof fn) {
        opts = fn;
    }
    if (!opts || "object" !== typeof opts) {
        throw new Error("the `Greenlock.init(fn)` function should return an object `{ packageRoot, cluster }`");
    }

    // just for ironic humor
    ["cloudnative", "cloudscale", "webscale", "distributed", "blockchain"].forEach(function(k) {
        if (opts[k]) {
            opts.cluster = true;
        }
    });

    if (opts.cluster) {
        return require("./master.js").create(opts);
    }

    return require("./single.js").create(opts);
};
