#!/usr/bin/env node
"use strict";
/*global Promise*/

///////////////////////
// wildcard example //
//////////////////////

//
// wildcard example
//

//var glx = require('greenlock-express')
var glx = require("../").create({
    version: "draft-11", // Let's Encrypt v2 is ACME draft 11

    server: "https://acme-staging-v02.api.letsencrypt.org/directory",
    //, server: 'https://acme-v02.api.letsencrypt.org/directory'  // If at first you don't succeed, stop and switch to staging
    // https://acme-staging-v02.api.letsencrypt.org/directory

    configDir: "~/acme/", // You MUST have access to write to directory where certs
    // are saved. ex: /home/foouser/.config/acme

    approveDomains: myApproveDomains, // Greenlock's wraps around tls.SNICallback. Check the
    // domain name here and reject invalid ones

    app: require("./my-express-app.js"), // Any node-style http app (i.e. express, koa, hapi, rill)

    /* CHANGE TO A VALID EMAIL */
    email: "jon.doe@example.com", // Email for Let's Encrypt account and Greenlock Security
    agreeTos: true, // Accept Let's Encrypt ToS
    communityMember: true, // Join Greenlock to (very rarely) get important updates

    //, debug: true
    store: require("le-store-fs")
});

var server = glx.listen(80, 443);
server.on("listening", function() {
    console.info(server.type + " listening on", server.address());
});

function myApproveDomains(opts) {
    console.log("sni:", opts.domain);

    // must be 'example.com' or start with 'example.com'
    if (
        "example.com" !== opts.domain &&
        "example.com" !==
            opts.domain
                .split(".")
                .slice(1)
                .join(".")
    ) {
        return Promise.reject(new Error("we don't serve your kind here: " + opts.domain));
    }

    // the primary domain for the cert
    opts.subject = "example.com";
    // the altnames (including the primary)
    opts.domains = [opts.subject, "*.example.com"];

    if (!opts.challenges) {
        opts.challenges = {};
    }
    opts.challenges["http-01"] = require("le-challenge-fs").create({});
    // Note: When implementing a dns-01 plugin you should make it check in a loop
    // until it can positively confirm that the DNS changes have propagated.
    // That could take several seconds to a few minutes.
    opts.challenges["dns-01"] = require("le-challenge-dns").create({});

    // explicitly set account id and certificate.id
    opts.account = { id: opts.email };
    opts.certificate = { id: opts.subject };

    return Promise.resolve(opts);
}
