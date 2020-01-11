"use strict";

// This can be a node http app (shown),
// an Express app, or Hapi, Koa, Rill, etc
var app = function(req, res) {
    res.end("Hello, Encrypted World!");
};

//require("greenlock-express")
require("../../")
    .init({
        // Package name+version are taken from <packageRoot>/package.json and used for ACME client user agent
        packageRoot: __dirname,
        // configDir is relative to packageRoot, not _this_ file
        configDir: "./greenlock.d",

        // Maintainer email is the contact for critical bug and security notices
        // by default package.json.author.email will be used
        //maintainerEmail: "jon@example.com",

        // Change to true when you're ready to make your app cloud-scale
        cluster: false
    })

    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
