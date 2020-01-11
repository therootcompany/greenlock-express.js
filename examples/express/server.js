"use strict";

var app = require("./my-express-app.js");

app.get("/hello", function(req, res) {
    res.end("Hello, Encrypted World!");
});

//require("greenlock-express")
require("../../")
    .init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",

        maintainerEmail: "jon@example.com",

        cluster: false
    })

    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
