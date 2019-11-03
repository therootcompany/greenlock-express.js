"use strict";

var HttpMiddleware = module.exports;
var servernameRe = /^[a-z0-9\.\-]+$/i;
var challengePrefix = "/.well-known/acme-challenge/";

HttpMiddleware.create = function(gl, defaultApp) {
    if (defaultApp && "function" !== typeof defaultApp) {
        throw new Error("use greenlock.httpMiddleware() or greenlock.httpMiddleware(function (req, res) {})");
    }

    return function(req, res, next) {
        var hostname = HttpMiddleware.sanitizeHostname(req);

        req.on("error", function(err) {
            explainError(gl, err, "http_01_middleware_socket", hostname);
        });

        // Skip unless the path begins with /.well-known/acme-challenge/
        if (!hostname || 0 !== req.url.indexOf(challengePrefix)) {
            skipChallenge(req, res, next, defaultApp);
            return;
        }

        // HEADERS SENT DEBUG NOTE #2
        // at this point, it's most likely Let's Encrypt server
        // (or greenlock itself) performing the verification process
        // Hmmm... perhaps we should change the greenlock prefix to test
        // Anyway, we just got fast the first place where we could
        // be sending headers.

        var token = req.url.slice(challengePrefix.length);

        var done = false;
        var countA = 0;
        var countB = 0;
        gl.getAcmeHttp01ChallengeResponse({ type: "http-01", servername: hostname, token: token })
            .catch(function(err) {
                countA += 1;
                // HEADERS SENT DEBUG NOTE #3
                // This is the second possible time we could be sending headers
                respondToError(gl, res, err, "http_01_middleware_challenge_response", hostname);
                done = true;
                return { __done: true };
            })
            .then(function(result) {
                countB += 1;
                if (result && result.__done) {
                    return;
                }
                if (done) {
                    console.error("Sanity check fail: `done` is in a quantum state of both true and false... huh?");
                    return;
                }
                // HEADERS SENT DEBUG NOTE #4b
                // This is the third/fourth possible time send headers
                return respondWithGrace(res, result, hostname, token);
            })
            .catch(function(err) {
                // HEADERS SENT DEBUG NOTE #5
                // I really don't see how this can be possible.
                // Every case appears to be accounted for
                console.error();
                console.error("[warning] Developer Error:" + (err.code || err.context || ""), countA, countB);
                console.error(err.stack);
                console.error();
                console.error(
                    "This is probably the error that happens routinely on http2 connections, but we're not sure why."
                );
                console.error("To track the status or help contribute,");
                console.error("visit: https://git.rootprojects.org/root/greenlock-express.js/issues/9");
                console.error();
                try {
                    res.end("Internal Server Error [1003]: See logs for details.");
                } catch (e) {
                    // ignore
                }
            });
    };
};

function skipChallenge(req, res, next, defaultApp) {
    if ("function" === typeof defaultApp) {
        defaultApp(req, res, next);
    } else if ("function" === typeof next) {
        next();
    } else {
        res.statusCode = 500;
        res.end("[500] Developer Error: app.use('/', greenlock.httpMiddleware()) or greenlock.httpMiddleware(app)");
    }
}

function respondWithGrace(res, result, hostname, token) {
    var keyAuth = result && result.keyAuthorization;

    // HEADERS SENT DEBUG NOTE #4b
    // This is (still) the third/fourth possible time we could be sending headers
    if (keyAuth && "string" === typeof keyAuth) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(keyAuth);
        return;
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: { message: "domain '" + hostname + "' has no token '" + token + "'." } }));
}

function explainError(gl, err, ctx, hostname) {
    if (!err.servername) {
        err.servername = hostname;
    }
    if (!err.context) {
        err.context = ctx;
    }
    // leaving this in the build for now because it will help with existing error reports
    console.error("[warning] network connection error:", (err.context || "") + " " + err.message);
    (gl.notify || gl._notify)("error", err);
    return err;
}

function respondToError(gl, res, err, ctx, hostname) {
    // HEADERS SENT DEBUG NOTE #3b
    // This is (still) the second possible time we could be sending headers
    err = explainError(gl, err, ctx, hostname);
    res.statusCode = 500;
    res.end("Internal Server Error [1004]: See logs for details.");
}

HttpMiddleware.getHostname = function(req) {
    return req.hostname || req.headers["x-forwarded-host"] || (req.headers.host || "");
};
HttpMiddleware.sanitizeHostname = function(req) {
    // we can trust XFH because spoofing causes no ham in this limited use-case scenario
    // (and only telebit would be legitimately setting XFH)
    var servername = HttpMiddleware.getHostname(req)
        .toLowerCase()
        .replace(/:.*/, "");
    try {
        req.hostname = servername;
    } catch (e) {
        // read-only express property
    }
    if (req.headers["x-forwarded-host"]) {
        req.headers["x-forwarded-host"] = servername;
    }
    try {
        req.headers.host = servername;
    } catch (e) {
        // TODO is this a possible error?
    }

    return (servernameRe.test(servername) && -1 === servername.indexOf("..") && servername) || "";
};
