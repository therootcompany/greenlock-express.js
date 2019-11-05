"use strict";

require("./main.js");

var Master = module.exports;

var cluster = require("cluster");
var os = require("os");
var msgPrefix = "greenlock:";

Master.create = function(opts) {
    var resolveCb;
    var _readyCb;
    var _kicked = false;

    var greenlock = require("./greenlock-shim.js").create(opts);

    var ready = new Promise(function(resolve) {
        resolveCb = resolve;
    }).then(function(fn) {
        _readyCb = fn;
        return fn;
    });

    function kickoff() {
        if (_kicked) {
            return;
        }
        _kicked = true;

        Master._spawnWorkers(opts, greenlock);

        ready.then(function(fn) {
            // not sure what this API should be yet
            fn();
        });
    }

    var master = {
        ready: function() {
            kickoff();
            return master;
        },
        master: function(fn) {
            if (_readyCb) {
                throw new Error("can't call master twice");
            }
            kickoff();
            resolveCb(fn);
            return master;
        },
        serve: function(fn) {
            // ignore
            master.ready(fn);
        }
    };
    return master;
};

function range(n) {
    n = parseInt(n, 10);
    if (!n) {
        return [];
    }
    return new Array(n).join(",").split(",");
}

Master._spawnWorkers = function(opts, greenlock) {
    var numCpus = parseInt(process.env.NUMBER_OF_PROCESSORS, 10) || os.cpus().length;

    // process rpc messages
    // start when dead
    var numWorkers = parseInt(opts.workers || opts.numWorkers, 10);
    if (!numWorkers) {
        if (numCpus <= 2) {
            numWorkers = 2;
        } else {
            numWorkers = numCpus - 1;
        }
    }

    cluster.once("exit", function() {
        setTimeout(function() {
            process.exit(3);
        }, 100);
    });

    var workers = range(numWorkers);
    function next() {
        if (!workers.length) {
            return;
        }
        workers.pop();

        // for a nice aesthetic
        setTimeout(function() {
            Master._spawnWorker(opts, greenlock);
            next();
        }, 250);
    }

    next();
};

Master._spawnWorker = function(opts, greenlock) {
    var w = cluster.fork();
    // automatically added to master's `cluster.workers`
    w.once("exit", function(code, signal) {
        // TODO handle failures
        // Should test if the first starts successfully
        // Should exit if failures happen too quickly

        // For now just kill all when any die
        if (signal) {
            console.error("worker was killed by signal:", signal);
        } else if (code !== 0) {
            console.error("worker exited with error code:", code);
        } else {
            console.error("worker unexpectedly quit without exit code or signal");
        }
        process.exit(2);

        //addWorker();
    });

    function handleMessage(msg) {
        if (0 !== (msg._id || "").indexOf(msgPrefix)) {
            return;
        }
        if ("string" !== typeof msg._funcname) {
            // TODO developer error
            return;
        }

        function rpc() {
            return greenlock[msg._funcname](msg._input)
                .then(function(result) {
                    w.send({
                        _id: msg._id,
                        _result: result
                    });
                })
                .catch(function(e) {
                    var error = new Error(e.message);
                    Object.getOwnPropertyNames(e).forEach(function(k) {
                        error[k] = e[k];
                    });
                    w.send({
                        _id: msg._id,
                        _error: error
                    });
                });
        }

        try {
            rpc();
        } catch (e) {
            console.error("Unexpected and uncaught greenlock." + msg._funcname + " error:");
            console.error(e);
        }
    }

    w.on("message", handleMessage);
};
