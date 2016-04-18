'use strict';

// allow node.js to bind to port 80 and 443 without root:
//
//   sudo setcap 'cap_net_bind_service=+ep' `which node`

/* Note: using staging server url, remove .testing() for production
Using .testing() will overwrite the debug flag with true */
var LEX = require('letsencrypt-express').testing();
var http = require('http');
// NOTE: you could use the old https module if for some reason
// you don't want to support modern browsers
var https = require('spdy');
var leConfDir = require('os').homedir() + '/letsencrypt/etc';
throw new Error(
    "You must edit the example to change the email address (and remove this error)."
  + " Also, you'll need to remove .testing() and rm -rf '" + leConfDir + "'"
  + " to get actual, trusted production certificates.");
var lex = LEX.create({
  configDir: leConfDir
, approveRegistration: function (hostname, cb) { // leave `null` to disable automatic registration
    // Note: this is the place to check your database to get the user associated with this domain
    cb(null, {
      domains: [hostname]
    , email: 'CHANGE_ME' // user@example.com
    , agreeTos: true
    });
  }
});

function redirectHttp() {
  http.createServer(LEX.createAcmeResponder(lex, function redirectHttps(req, res) {
    res.setHeader('Location', 'https://' + req.headers.host + req.url);
    res.statusCode = 302;
    res.end('<!-- Hello Developer Person! Please use HTTPS instead -->');
  })).listen(80);
}

function serveHttps() {
  var app = require('express')();

  app.use('/', function (req, res) {
    res.end('Hello!');
  });

  https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app)).listen(443);
}

redirectHttp();
serveHttps();
