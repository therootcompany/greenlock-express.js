'use strict';

var express = require('express');
var basicAuth = require('express-basic-auth');
var crypto = require('crypto');
var serveIndex = require('serve-index');

var rootIndex = serveIndex('/', { hidden: true, icons: true, view: 'details' });
var rootFs = express.static('/', { dotfiles: 'allow', redirect: true, index: false });

var userIndex = serveIndex(require('os').homedir(), { hidden: true, icons: true, view: 'details' });
var userFs = express.static(require('os').homedir(), { dotfiles: 'allow', redirect: true, index: false });

var app = express();
var realm = 'Login Required';
var secret = crypto.randomBytes(16).toString('hex');

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
  res.status(401);
  res.statusCode = 401;
  //res.setHeader('Location', '/');
  res.end('Logged out &nbsp; | &nbsp; <a href="/">Home</a>');
});
app.use('/browse', function (req, res, next) {
  myAuth(req, res, next);
});
app.use('/browse', function (req, res, next) {
  if ('root' === req.auth.user) { rootFs(req, res, function () { rootIndex(req, res, next); }); return; }
  if ('user' === req.auth.user) { userFs(req, res, function () { userIndex(req, res, next); }); return; }
  res.end('Sad Panda');
});

console.log('');
console.log('');
console.log('\t' + secret);
console.log('');
console.log("\tShhhh... It's a secret to everybody!");
console.log('');
console.log('');

module.exports = app;
