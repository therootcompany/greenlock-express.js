// First and foremost:
// I'm not a fan of `socket.io` because it's huge and complex.
// I much prefer `ws` because it's very simple and easy.
// That said, it's popular.......
"use strict";

// Note: You DO NOT NEED socket.io
//       You can just use WebSockets
//       (see the websocket example)

function httpsWorker(glx) {
    var socketio = require("socket.io");
    var io;

    // we need the raw https server
    var server = glx.httpsServer();

    io = socketio(server);

    // Then you do your socket.io stuff
    io.on("connection", function(socket) {
        console.log("a user connected");
        socket.emit("Welcome");

        socket.on("chat message", function(msg) {
            socket.broadcast.emit("chat message", msg);
        });
    });

    // servers a node app that proxies requests to a localhost
    glx.serveApp(function(req, res) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end("Hello, World!\n\n💚 🔒.js");
    });
}

var pkg = require("../../package.json");
//require("greenlock-express")
require("../../")
    .init(function getConfig() {
        // Greenlock Config

        return {
            package: { name: "socket-io-example", version: pkg.version },
            maintainerEmail: "jon@example.com",
            cluster: false
        };
    })
    .serve(httpsWorker);
