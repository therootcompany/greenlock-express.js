"use strict";

var SanitizeHost = module.exports;
var HttpMiddleware = require("./http-middleware.js");

SanitizeHost.create = function(gl, app) {
    return function(req, res, next) {
        function realNext() {
            if ("function" === typeof app) {
                app(req, res);
            } else if ("function" === typeof next) {
                next();
            } else {
                res.statusCode = 500;
                res.end("Error: no middleware assigned");
            }
        }

        var hostname = HttpMiddleware.getHostname(req);
        // Replace the hostname, and get the safe version
        var safehost = HttpMiddleware.sanitizeHostname(req);

        // if no hostname, move along
        if (!hostname) {
            realNext();
            return;
        }

        // if there were unallowed characters, complain
        if (safehost.length !== hostname.length) {
            res.statusCode = 400;
            res.end("Malformed HTTP Header: 'Host: " + hostname + "'");
            return;
        }

        // Note: This sanitize function is also called on plain sockets, which don't need Domain Fronting checks
        if (req.socket.encrypted) {
            if (req.socket && "string" === typeof req.socket.servername) {
                // Workaround for https://github.com/nodejs/node/issues/22389
                if (!SanitizeHost._checkServername(safehost, req.socket)) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.end(
                        "<h1>Domain Fronting Error</h1>" +
                            "<p>This connection was secured using TLS/SSL for '" +
                            (req.socket.servername || "").toLowerCase() +
                            "'</p>" +
                            "<p>The HTTP request specified 'Host: " +
                            safehost +
                            "', which is (obviously) different.</p>" +
                            "<p>Because this looks like a domain fronting attack, the connection has been terminated.</p>"
                    );
                    return;
                }
            }
            /*
      else if (safehost && !gl._skip_fronting_check) {

				// We used to print a log message here, but it turns out that it's
				// really common for IoT devices to not use SNI (as well as many bots
				// and such).
				// It was common for the log message to pop up as the first request
				// to the server, and that was confusing. So instead now we do nothing.

				//console.warn("no string for req.socket.servername," + " skipping fronting check for '" + safehost + "'");
				//gl._skip_fronting_check = true;
			}
      */
        }

        // carry on
        realNext();
    };
};

var warnDomainFronting = true;
var warnUnexpectedError = true;
SanitizeHost._checkServername = function(safeHost, tlsSocket) {
    var servername = (tlsSocket.servername || "").toLowerCase();

    // acceptable: older IoT devices may lack SNI support
    if (!servername) {
        return true;
    }
    // acceptable: odd... but acceptable
    if (!safeHost) {
        return true;
    }
    if (safeHost === servername) {
        return true;
    }

    if ("function" !== typeof tlsSocket.getCertificate) {
        // domain fronting attacks allowed
        if (warnDomainFronting) {
            // https://github.com/nodejs/node/issues/24095
            console.warn(
                "Warning: node " +
                    process.version +
                    " is vulnerable to domain fronting attacks. Please use node v11.2.0 or greater."
            );
            warnDomainFronting = false;
        }
        return true;
    }

    // connection established with servername and session is re-used for allowed name
    // See https://github.com/nodejs/node/issues/24095
    var cert = tlsSocket.getCertificate();
    try {
        // TODO optimize / cache?
        // *should* always have a string, right?
        // *should* always be lowercase already, right?
        //console.log(safeHost, cert.subject.CN, cert.subjectaltname);
        var isSubject = (cert.subject.CN || "").toLowerCase() === safeHost;
        if (isSubject) {
            return true;
        }

        var dnsnames = (cert.subjectaltname || "").split(/,\s+/);
        var inSanList = dnsnames.some(function(name) {
            // always prefixed with "DNS:"
            return safeHost === name.slice(4).toLowerCase();
        });

        if (inSanList) {
            return true;
        }
    } catch (e) {
        // not sure what else to do in this situation...
        if (warnUnexpectedError) {
            console.warn("Warning: encoutered error while performing domain fronting check: " + e.message);
            warnUnexpectedError = false;
        }
        return true;
    }

    return false;
};
