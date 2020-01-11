"use strict";

// The WRONG way:
//var https = require('https');
//var httpsServer = https.createServer(tlsOptions, app);
//
// Why is that wrong?
// Greenlock needs to change some low-level http and https options.
// Use glx.httpsServer(tlsOptions, app) instead.

//require("greenlock-express")
require("../../")
    .init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",

        maintainerEmail: "jon@example.com",
        cluster: false
    })
    .ready(httpsWorker);

function httpsWorker(glx) {
    //
    // HTTPS 1.1 is the default
    // (HTTP2 would be the default but... https://github.com/expressjs/express/issues/3388)
    //

    // Get the raw https server:
    var httpsServer = glx.httpsServer(null, function(req, res) {
        res.end("Hello, Encrypted World!");
    });

    httpsServer.listen(443, "0.0.0.0", function() {
        console.info("Listening on ", httpsServer.address());
    });

    // Note:
    // You must ALSO listen on port 80 for ACME HTTP-01 Challenges
    // (the ACME and http->https middleware are loaded by glx.httpServer)
    var httpServer = glx.httpServer();

    httpServer.listen(80, "0.0.0.0", function() {
        console.info("Listening on ", httpServer.address());
    });
}
