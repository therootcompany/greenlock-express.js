"use strict";

var Init = module.exports;

var fs = require("fs");
var path = require("path");

Init.init = function(opts) {
    //var Rc = require("@root/greenlock/rc");
    var Rc = require("./rc.js");
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
        opts.maintainerEmail = myPkg.author;
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
        // Place the rc file in the packageroot
        opts.configDir = Rc._initSync(opts.packageRoot, opts.configDir);
    }

    if (!opts.configDir) {
        throw new Error("missing `packageRoot` and `configDir`");
    }

    // Place the rc file in the configDir itself
    //Rc._initSync(opts.configDir, opts.configDir);
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
