#!/usr/bin/env node
'use strict';

///////////////////
// vhost example //
///////////////////

//
// virtual hosting example
//

// The prefix where sites go by name.
// For example: whatever.com may live in /srv/www/whatever.com, thus /srv/www is our path
var srv = '/srv/www/';

var path = require('path');
var fs = require('fs');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

//var glx = require('greenlock-express')
var glx = require('../').create({

  version: 'draft-11'                                       // Let's Encrypt v2 is ACME draft 11

, server: 'https://acme-v02.api.letsencrypt.org/directory'  // If at first you don't succeed, stop and switch to staging
                                                            // https://acme-staging-v02.api.letsencrypt.org/directory

, configDir: '~/.config/acme/'                              // You MUST have access to write to directory where certs
                                                            // are saved. ex: /home/foouser/.config/acme

, approveDomains: myApproveDomains                          // Greenlock's wraps around tls.SNICallback. Check the
                                                            // domain name here and reject invalid ones

, app: myVhostApp                                           // Any node-style http app (i.e. express, koa, hapi, rill)

  /* CHANGE TO A VALID EMAIL */
, email:'jon@example.com'                                   // Email for Let's Encrypt account and Greenlock Security
, agreeTos: true                                            // Accept Let's Encrypt ToS
, communityMember: true                                     // Join Greenlock to get important updates, no spam

//, debug: true

});

var server = glx.listen(80, 443);
server.on('listening', function () {
  console.info(server.type + " listening on", server.address());
});

// [SECURITY]
// Since v2.4.0+ Greenlock proactively protects against
// SQL injection and timing attacks by rejecting invalid domain names,
// but it's up to you to make sure that you accept opts.domain BEFORE
// an attempt is made to issue a certificate for it.
function myApproveDomains(opts, certs, cb) {

  // In this example the filesystem is our "database".
  // We check in /srv/www/ for opts.domain (i.e. "example.com") and only proceed if it exists.
  console.log(opts.domain);

  // Check that the hosting domain exists on the file system.
  var hostdir = path.join(srv, opts.domain);
  fs.readdir(hostdir, function (err, nodes) {
    var e;
    if (err || !nodes) {
      e = new Error("rejecting '" + opts.domains[0] + "' because '" + hostdir + "' could not be read");
      console.error(e);
      console.error(err);
      cb(e);
      return;
    }

    // You could put a variety of configuration details alongside the vhost folder
    // For example, /srv/www/example.com.json could describe the following:

    // If you have multiple domains grouped together, you can list them on the same certificate
    // opts.domains = [ 'example.com', 'www.example.com', 'api.example.com', 'sso.example.com' ]

    // You can also change other options on-the-fly
    // (approveDomains is called after the in-memory certificates cache is checked, but before any ACME requests)

    // opts.email = "jon@example.com"
    // opts.agreeTos = true;
    // opts.challengeType = 'http-01';
    // opts.challenge = require('le-challenge-fs').create({});
    cb(null, { options: opts, certs: certs });
  });

}

// [SECURITY]
// Since v2.4.0+ Greenlock Express will proactively protect against
// SQL injection and timing attacks by rejecting invalid domain names
// in Host headers.
// It will also make them lowercase and protect against "domain fronting".
// However, it's up to you to make sure you actually have a domain to serve :)
var servers = {};
function myVhostApp(req, res) {
  var hostname = req.headers.host;
  var srvpath = path.join(srv, hostname);
  console.log('vhost for', req.headers.host);

  if (!servers[hostname]) {
    try {
      fs.accessSync(srvpath);
      servers[hostname] = serveStatic(srvpath, { redirect: true });
    } catch(e) {
      finalhandler(req, res);
    }
  }

  servers[hostname](req, res, finalhandler(req, res));
}
