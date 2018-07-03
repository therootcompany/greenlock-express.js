'use strict';


////////////////////////
// Greenlock Setup    //
////////////////////////

//var Greenlock = require('greenlock-express');
var Greenlock = require('../');
var greenlock = Greenlock.create({

  // Let's Encrypt v2 is ACME draft 11
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory
  server: 'https://acme-v02.api.letsencrypt.org/directory'
, version: 'draft-11'
, configDir: '~/.config/acme/'

  // You MUST change these to a valid email and domains
, email: 'john.doe@example.com'
, approveDomains: [ 'example.com', 'www.example.com' ]
, agreeTos: true

  // Get notified of important updates and help me make greenlock better
, communityMember: true
, telemetry: true
//, debug: true
});


////////////////////////
// http-01 Challenges //
////////////////////////

// http-01 challenge happens over plain http/1.1, not secure http
var redirectHttps = require('redirect-https')();
var acmeChallengeHandler = greenlock.middleware(redirectHttps);
require('http').createServer(acmeChallengeHandler).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});


////////////////////////
// secure http        //
////////////////////////

var myApp = require('./my-express-app.js');
// Use spdy for "h2" (http2) as to not be penalized by Google
var server = require('spdy').createSecureServer(greenlock.tlsOptions, myApp);


////////////////////////
// secure websockets  //
////////////////////////

var WebSocket = require('ws');
var ws = new WebSocket.Server({ server: server });
ws.on('connection', function (ws, req) {
  // inspect req.headers.authorization (or cookies) for session info
  ws.write("[Secure Echo Server] Hello!\nAuth: '" + (req.headers.authorization || '') + "'\n"
    + "Cookie: '" + (req.headers.cookie || '') + "'\n");
  ws.on('data', function (data) { ws.write(data); });
});

server.listen(443, function () {
  console.log("Listening for secure http and websocket requests on", this.address());
});
