'use strict';

//
// WARNING: Not for noobs
// Try the simple example first
//

//
// This demo is used with tunnel-server.js and tunnel-client.js
//

var email = 'john.doe@gmail.com';
var domains = [ 'example.com' ];
var agreeLeTos = true;
//var secret = "My Little Brony";
var secret = require('crypto').randomBytes(16).toString('hex');

require('../').create({
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory

, email: email
, agreeTos: agreeLeTos
, approveDomains: domains
, configDir: '~/.config/acme/'
, app: remoteAccess(secret)
  // Get notified of important updates and help me make greenlock better
, communityMember: true
//, debug: true
}).listen(3000, 8443);


function remoteAccess(secret) {
  var express = require('express');
  var basicAuth = require('express-basic-auth');
  var serveIndex = require('serve-index');

  var rootIndex = serveIndex('/', { hidden: true, icons: true, view: 'details' });
  var rootFs = express.static('/', { dotfiles: 'allow', redirect: true, index: false });

  var userIndex = serveIndex(require('os').homedir(), { hidden: true, icons: true, view: 'details' });
  var userFs = express.static(require('os').homedir(), { dotfiles: 'allow', redirect: true, index: false });

  var app = express();
  var realm = 'Login Required';

  var myAuth = basicAuth({
    users: { 'root': secret, 'user': secret }
  , challenge: true
  , realm: realm
  , unauthorizedResponse: function (/*req*/) {
      return 'Unauthorized <a href="/">Home</a>';
    }
  });

  app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<a href="/browse/">View Files</a>'
    + '&nbsp; | &nbsp;'
    + '<a href="/logout/">Logout</a>'
    );
  });
  app.use('/logout', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.statusCode = 401;
    //res.setHeader('Location', '/');
    res.end('Logged out &nbsp; | &nbsp; <a href="/">Home</a>');
  });
  app.use('/browse', myAuth);
  app.use('/browse', function (req, res, next) {
    if ('root' === req.auth.user) { rootFs(req, res, function () { rootIndex(req, res, next); }); return; }
    if ('user' === req.auth.user) { userFs(req, res, function () { userIndex(req, res, next); }); return; }
    res.end('Sad Panda');
  });

  console.log('');
  console.log('');
  console.log('Usernames are\n');
  console.log('\troot');
  console.log('\tuser');
  console.log('');
  console.log('Password (for both) is\n');
  console.log('\t' + secret);
  console.log('');
  console.log("Shhhh... It's a secret to everybody!");
  console.log('');
  console.log('');

  return app;
}
