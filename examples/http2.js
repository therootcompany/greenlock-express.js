'use strict';

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
var acmeChallengeHandler = greenlock.middleware(redirectHttps);
require('http').createServer(acmeChallengeHandler).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});



////////////////////////
// node.js' http2 api //
////////////////////////

// http2 is a new API with which you would use hapi or koa, not express
var server = require('http2').createSecureServer(greenlock.tlsOptions);
server.on('error', function (err) {
  console.error(err);
});
server.on('stream', function (stream, headers) {
  console.log(headers);
  stream.respond({
    'content-type': 'text/html'
  , ':status': 200
  });
  stream.end('Hello, HTTP2 World!');
});
server.on('listening', function () {
  console.log("Listening for http2 requests on", this.address());
});
server.listen(443);
