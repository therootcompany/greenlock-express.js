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
, app: require('./my-express-app.js')

  // You MUST change these to a valid email and domains
, email: 'john.doe@example.com'
, approvedDomains: [ 'example.com', 'www.example.com' ]
, agreeTos: true

  // Get notified of important updates and help me make greenlock better
, communityMember: true
, telemetry: true
//, debug: true
});

var server = greenlock.listen(80, 443);

var WebSocket = require('ws');
var ws = new WebSocket.Server({ server: server });
ws.on('connection', function (ws, req) {
  // inspect req.headers.authorization (or cookies) for session info
  ws.send("[Secure Echo Server] Hello!\nAuth: '" + (req.headers.authorization || 'none') + "'\n"
    + "Cookie: '" + (req.headers.cookie || 'none') + "'\n");
  ws.on('message', function (data) { ws.send(data); });
});
