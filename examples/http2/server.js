"use strict";

// The WRONG way:
//var http2 = require('http2');
//var http2Server = https.createSecureServer(tlsOptions, app);
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
    // HTTP2 would have been the default httpsServer for node v12+
    // However... https://github.com/expressjs/express/issues/3388
    //

    // Get the raw http2 server:
    var tlsOptions = null;
    var http2Server = glx.http2Server(tlsOptions, function(req, res) {
        res.end("Hello, Encrypted World!");
    });

    http2Server.listen(443, "0.0.0.0", function() {
        console.info("Listening on ", http2Server.address());
    });

    // Note:
    // You must ALSO listen on port 80 for ACME HTTP-01 Challenges
    // (the ACME and http->https middleware are loaded by glx.httpServer)
    var httpServer = glx.httpServer();

    httpServer.listen(80, "0.0.0.0", function() {
        console.info("Listening on ", httpServer.address());
    });
}
