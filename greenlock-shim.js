"use strict";

var path = require("path");
var fs = require("fs");

module.exports.create = function(opts) {
    var Greenlock = require("@root/greenlock");
    var Init = require("./init.js");
    var greenlock = opts.greenlock;

    /*
    if (!greenlock && opts.packageRoot) {
        try {
            greenlock = require(path.resolve(opts.packageRoot, "greenlock.js"));
        } catch (e) {
            if ("MODULE_NOT_FOUND" !== e.code) {
                throw e;
            }
        }
    }
    */

    if (!greenlock) {
        opts = Init._init(opts);
        greenlock = Greenlock.create(opts);
    }

    try {
        if (opts.notify) {
            greenlock._defaults.notify = opts.notify;
        }
    } catch (e) {
        console.error("Developer Error: notify not attached correctly");
    }

    // re-export as top-level function to simplify rpc with workers
    greenlock.getAcmeHttp01ChallengeResponse = function(opts) {
        return greenlock.challenges.get(opts);
    };

    greenlock._find({}).then(function(sites) {
        if (sites.length <= 0) {
            console.warn("warning: No sites available. Did you add them?");
            console.warn("         npx greenlock add --subject example.com --altnames example.com");
            return;
        }
        console.info("Ready to Serve:");

        var max = 3;
        if (sites.length >= 1) {
            sites.slice(0, max).forEach(function(site) {
                console.info("\t", site.altnames.join(" "));
            });
        }
        if (sites.length > max) {
            console.info("and %d others", sites.length - max);
        }
    });

    return greenlock;
};
