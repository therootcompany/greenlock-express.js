"use strict";

var path = require("path");
var fs = require("fs");

module.exports.create = function(opts) {
    var Greenlock = require("@root/greenlock");
    var greenlock = opts.greenlock;
    var pkgText;
    var pkgErr;
    var msgErr;
    //var emailErr;
    var realPkg;
    var userPkg;
    var myPkg = {};
    // we want to be SUPER transparent that we're reading from package.json
    // we don't want anything unexpected
    var implicitConfig = [];
    var rc;

    if (!greenlock && opts.packageRoot) {
        try {
            greenlock = require(path.resolve(opts.packageRoot, "greenlock.js"));
        } catch (e) {
            if ("MODULE_NOT_FOUND" !== e.code) {
                throw e;
            }
        }
    }

    if (!greenlock) {
        if (opts.packageRoot) {
            try {
                pkgText = fs.readFileSync(path.resolve(opts.packageRoot, "package.json"), "utf8");
            } catch (e) {
                pkgErr = e;
                console.warn("`packageRoot` should be the root of the package (probably `__dirname`)");
            }
        }

        if (pkgText) {
            try {
                realPkg = JSON.parse(pkgText);
            } catch (e) {
                pkgErr = e;
            }
        }

        userPkg = opts.package;

        if (realPkg || userPkg) {
            userPkg = userPkg || {};
            realPkg = realPkg || {};

            // build package agent
            if (!opts.packageAgent) {
                // name
                myPkg.name = userPkg.name;
                if (!myPkg.name) {
                    myPkg.name = realPkg.name;
                    implicitConfig.push("name");
                }

                // version
                myPkg.version = userPkg.version;
                if (!myPkg.version) {
                    myPkg.version = realPkg.version;
                    implicitConfig.push("version");
                }
                if (myPkg.name && myPkg.version) {
                    opts.packageAgent = myPkg.name + "/" + myPkg.version;
                }
            }

            // build author
            myPkg.author = opts.maintainerEmail;
            if (!myPkg.author) {
                myPkg.author = (userPkg.author && userPkg.author.email) || userPkg.author;
            }
            if (!myPkg.author) {
                implicitConfig.push("author");
                myPkg.author = (realPkg.author && realPkg.author.email) || realPkg.author;
            }
            opts.maintainerEmail = myPkg.maintainerEmail;
        }

        if (!opts.packageAgent) {
            msgErr = "missing `packageAgent` and also failed to read `name` and/or `version` from `package.json`";
            if (pkgErr) {
                msgErr += ": " + pkgErr.message;
            }
            throw new Error(msgErr);
        }

        opts.maintainerEmail = parseMaintainer(opts.maintainerEmail);
        if (!opts.maintainerEmail) {
            msgErr =
                "missing or malformed `maintainerEmail` (or `author` from `package.json`), which is used as the contact for support notices";
            throw new Error(msgErr);
        }

        opts.packageAgent = addGreenlockAgent(opts);

        if (opts.packageRoot) {
            try {
                rc = JSON.parse(fs.readFileSync(path.resolve(opts.packageRoot, ".greenlockrc")));
            } catch (e) {
                if ("ENOENT" !== e.code) {
                    throw e;
                }
                rc = {};
            }

            if (opts.configFile && opts.configFile !== rc.configFile) {
                if (rc.configFile) {
                    console.info("changing `configFile` from '%s' to '%s'", rc.configFile, opts.configFile);
                }
                rc.configFile = opts.configFile;

                if (!rc.manager) {
                    rc.manager = "@greenlock/manager";
                }

                fs.writeFileSync(path.resolve(opts.packageRoot, ".greenlockrc"), JSON.stringify(rc));
            }
        }

        if (!greenlock) {
            greenlock = Greenlock.create(opts);
        }

        try {
            if (opts.notify) {
                greenlock._defaults.notify = opts.notify;
            }
        } catch (e) {
            console.error("Developer Error: notify not attached correctly");
        }
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
function parseMaintainer(maintainerEmail) {
    try {
        maintainerEmail = maintainerEmail.match(looseEmailRe)[2];
    } catch (e) {
        maintainerEmail = null;
    }

    return maintainerEmail;
}
