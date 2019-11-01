"use strict";

function httpsWorker(glx) {
    var app = require("./my-express-app.js");

    app.get("/hello", function(req, res) {
        res.end("Hello, Encrypted World!");
    });

    // Serves on 80 and 443
    // Get's SSL certificates magically!
    glx.serveApp(app);
}

var pkg = require("../../package.json");
//require("greenlock-express")
require("../../")
    .init(function getConfig() {
        // Greenlock Config

        return {
            package: { name: "http2-example", version: pkg.version },
            maintainerEmail: "jon@example.com",
            cluster: false
        };
    })
    .serve(httpsWorker);
