"use strict";

var Rc = module.exports;
var fs = require("fs");
var path = require("path");

Rc._initSync = function(dirname, configDir) {
    // dirname / opts.packageRoot
    var rcpath = path.resolve(dirname, ".greenlockrc");
    var rc;

    try {
        rc = JSON.parse(fs.readFileSync(rcpath));
    } catch (e) {
        if ("ENOENT" !== e.code) {
            throw e;
        }
        rc = {};
    }

    if (!configDir) {
        configDir = rc.configDir;
    }

    if (configDir && configDir !== rc.configDir) {
        if (rc.configDir) {
            console.info("changing `configDir` from '%s' to '%s'", rc.configDir, configDir);
        }
        rc.configDir = configDir;
        /* if (!rc.manager) { rc.manager = "@greenlock/manager"; } */
        fs.writeFileSync(rcpath, JSON.stringify(rc));
    } else if (!rc.configDir) {
        configDir = path.resolve(dirname, "greenlock.d");
        rc.configDir = configDir;
        fs.writeFileSync(rcpath, JSON.stringify(rc));
    }

    return configDir;
};
