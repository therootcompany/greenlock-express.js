'use strict';

var express = require('express');
var app = express();
var basicAuth = require('express-basic-auth');
var crypto = require('crypto');
var secret = crypto.randomBytes(16).toString('hex');
var serveIndex = require('serve-index');
var rootIndex = serveIndex('/', { hidden: true, icons: true, view: 'details' });
var rootFs = express.static('/', { dotfiles: 'allow', redirect: true, index: false });
var userIndex = serveIndex(require('os').homedir(), { hidden: true, icons: true, view: 'details' });
var userFs = express.static(require('os').homedir(), { dotfiles: 'allow', redirect: true, index: false });
var myAuth = basicAuth({
  users: { 'root': secret, 'user': secret }
});

app.get('/', function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<form action=\"/browse\" method=\"get\"><button type=\"submit\">Login to view Files</button></form>');
});
app.use('/browse', function (req, res, next) {
  console.log('trying to auth browse');
  myAuth(req, res, next);
});
app.use('/browse', function (req, res, next) {
  console.log('trying to get browse', req.url);
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
