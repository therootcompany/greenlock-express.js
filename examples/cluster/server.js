"use strict";

//require("greenlock-express")
require("../../")
    .init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",

        maintainerEmail: "jon@example.com",

        // When you're ready to go full cloud scale, you just change this to true:
        // Note: in cluster you CANNOT use in-memory state (see below)
        cluster: true,

        // This will default to the number of workers being equal to
        // n-1 cpus, with a minimum of 2
        workers: 4
    })
    .ready(httpsWorker);

function httpsWorker(glx) {
    // WRONG
    // This won't work like you
    // think because EACH worker
    // has ITS OWN `count`.
    var count = 0;

    var app = function(req, res) {
        res.end("Hello... how many times now? Oh, " + count + " times");
        count += 1;
    };

    // Serves on 80 and 443... for each worker
    // Get's SSL certificates magically!
    glx.serveApp(app);
}
