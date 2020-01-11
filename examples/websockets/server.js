"use strict";

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
    // we need the raw https server
    var server = glx.httpsServer();
    var WebSocket = require("ws");
    var ws = new WebSocket.Server({ server: server });
    ws.on("connection", function(ws, req) {
        // inspect req.headers.authorization (or cookies) for session info
        ws.send(
            "[Secure Echo Server] Hello!\nAuth: '" +
                (req.headers.authorization || "none") +
                "'\n" +
                "Cookie: '" +
                (req.headers.cookie || "none") +
                "'\n"
        );
        ws.on("message", function(data) {
            ws.send(data);
        });
    });

    // servers a node app that proxies requests to a localhost
    glx.serveApp(function(req, res) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end("Hello, World!\n\n💚 🔒.js");
    });
}
