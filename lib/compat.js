"use strict";

function requireBluebird() {
    try {
        return require("bluebird");
    } catch (e) {
        console.error("");
        console.error("DON'T PANIC. You're running an old version of node with incomplete Promise support.");
        console.error("EASY FIX: `npm install --save bluebird`");
        console.error("");
        throw e;
    }
}

if ("undefined" === typeof Promise) {
    global.Promise = requireBluebird();
}

if ("function" !== typeof require("util").promisify) {
    require("util").promisify = requireBluebird().promisify;
}

if (!console.debug) {
    console.debug = console.log;
}

var fs = require("fs");
var fsAsync = {};
Object.keys(fs).forEach(function(key) {
    var fn = fs[key];
    if ("function" !== typeof fn || !/[a-z]/.test(key[0])) {
        return;
    }
    fsAsync[key] = require("util").promisify(fn);
});

exports.fsAsync = fsAsync;
