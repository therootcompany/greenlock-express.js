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

        if (skipIfNeedBe(req, res, next, defaultApp, hostname)) {
            return;
        }

        var token = req.url.slice(challengePrefix.length);

        gl.getAcmeHttp01ChallengeResponse({ type: "http-01", servername: hostname, token: token })
            .catch(function(err) {
                respondToError(gl, res, err, "http_01_middleware_challenge_response", hostname);
                return { __done: true };
            })
            .then(function(result) {
                if (result && result.__done) {
                    return;
                }
                return respondWithGrace(res, result, hostname, token);
            });
    };
};

function skipIfNeedBe(req, res, next, defaultApp, hostname) {
    if (!hostname || 0 !== req.url.indexOf(challengePrefix)) {
        if ("function" === typeof defaultApp) {
            defaultApp(req, res, next);
        } else if ("function" === typeof next) {
            next();
        } else {
            res.statusCode = 500;
            res.end("[500] Developer Error: app.use('/', greenlock.httpMiddleware()) or greenlock.httpMiddleware(app)");
        }
    }
}

function respondWithGrace(res, result, hostname, token) {
    var keyAuth = result && result.keyAuthorization;
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
    (gl.notify || gl._notify)("error", err);
    return err;
}

function respondToError(gl, res, err, ctx, hostname) {
    err = explainError(gl, err, ctx, hostname);
    res.statusCode = 500;
    res.end("Internal Server Error: See logs for details.");
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
