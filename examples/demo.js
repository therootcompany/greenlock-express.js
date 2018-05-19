'use strict';

// npm install spdy@3.x

//var Greenlock = require('greenlock-express')
var Greenlock = require('../');

var greenlock = Greenlock.create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory

  // You MUST change this to a valid email address
, email: 'jon@example.com'

  // You MUST NOT build clients that accept the ToS without asking the user
, agreeTos: true

  // You MUST change these to valid domains
  // NOTE: all domains will validated and listed on the certificate
, approveDomains: [ 'example.com', 'www.example.com' ]

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: require('path').join(require('os').homedir(), 'acme', 'etc')

  // Get notified of important updates and help me make greenlock better
, communityMember: true

//, debug: true

});



////////////////////////
// http-01 Challenges //
////////////////////////

// http-01 challenge happens over http/1.1, not http2
var redirectHttps = require('redirect-https')();
var acmeChallengeHandler = greenlock.middleware(function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h1>Hello, ⚠️ Insecure World!</h1><a>Visit Secure Site</a>'
    + '<script>document.querySelector("a").href=window.location.href.replace(/^http/i, "https");</script>'
  );
});
require('http').createServer(acmeChallengeHandler).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});



////////////////////////
// http2 via SPDY h2  //
////////////////////////

// spdy is a drop-in replacement for the https API
var spdyOptions = Object.assign({}, greenlock.tlsOptions);
spdyOptions.spdy = { protocols: [ 'h2', 'http/1.1' ], plain: false };
var server = require('spdy').createServer(spdyOptions, require('express')().use('/', function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h1>Hello, 🔐 Secure World!</h1>');
}));
server.on('error', function (err) {
  console.error(err);
});
server.on('listening', function () {
  console.log("Listening for SPDY/http2/https requests on", this.address());
});
server.listen(443);
