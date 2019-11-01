"use strict";

require("./")
    .init(initialize)
    .serve(worker)
    .master(function() {
        console.log("Hello from master");
    });

function initialize() {
    var pkg = require("./package.json");
    var config = {
        package: {
            name: "Greenlock_Express_Demo",
            version: pkg.version,
            author: pkg.author
        },
        staging: true,
        cluster: true,

        notify: function(ev, params) {
            console.info(ev, params);
        }
    };
    return config;
}

function worker(glx) {
    console.info();
    console.info("Hello from worker #" + glx.id());

    glx.serveApp(function(req, res) {
        res.end("Hello, Encrypted World!");
    });
}
