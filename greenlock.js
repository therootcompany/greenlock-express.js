"use strict";

module.exports.create = function(opts) {
    opts = parsePackage(opts);
    opts.packageAgent = addGreenlockAgent(opts);

    var Greenlock = require("@root/greenlock");
    var greenlock = Greenlock.create(opts);

    // re-export as top-level function to simplify rpc with workers
    greenlock.getAcmeHttp01ChallengeResponse = function(opts) {
        return greenlock.challenges.get(opts);
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

// ex: "John Doe <john@example.com> (https://john.doe)"
// ex: "John Doe <john@example.com>"
// ex: "<john@example.com>"
// ex: "john@example.com"
var looseEmailRe = /(^|[\s<])([^'" <>:;`]+@[^'" <>:;`]+\.[^'" <>:;`]+)/;
function parsePackage(opts) {
    // 'package' is sometimes a reserved word
    var pkg = opts.package || opts.pkg;
    if (!pkg) {
        opts.maintainerEmail = parseMaintainer(opts.maintainerEmail);
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
            opts.maintainerEmail = pkg.author.email || pkg.author.match(looseEmailRe)[2];
        } catch (e) {}
    }
    if (!opts.maintainerEmail) {
        throw new Error("missing or malformed `package.author`, which is used as the contact for support notices");
    }
    opts.package = undefined;
    opts.maintainerEmail = parseMaintainer(opts.maintainerEmail);

    return opts;
}

function parseMaintainer(maintainerEmail) {
    try {
        maintainerEmail = maintainerEmail.match(looseEmailRe)[2];
    } catch (e) {
        maintainerEmail = null;
    }
    if (!maintainerEmail) {
        throw new Error("missing or malformed `maintainerEmail`, which is used as the contact for support notices");
    }
    return maintainerEmail;
}
