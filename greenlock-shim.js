"use strict";

module.exports.create = function(opts) {
    var Greenlock = require("@root/greenlock");
    //var Init = require("@root/greenlock/lib/init.js");
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
        //opts = Init._init(opts);
        greenlock = Greenlock.create(opts);
    }
    opts.packageAgent = addGreenlockAgent(opts);

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
            console.warn("Warning: `find({})` returned 0 sites.");
            console.warn("         Does `" + greenlock.manager._modulename + "` implement `find({})`?");
            console.warn("         Did you add sites?");
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

function addGreenlockAgent(opts) {
    // Add greenlock as part of Agent, unless this is greenlock
    var packageAgent = opts.packageAgent || "";
    if (!/greenlock(-express|-pro)?/i.test(packageAgent)) {
        var pkg = require("./package.json");
        packageAgent += " Greenlock_Express/" + pkg.version;
    }

    return packageAgent.trim();
}
