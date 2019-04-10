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
var srv = process.argv[3] || '/srv/www/';

var path = require('path');
var fs = require('fs').promises;
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

//var glx = require('greenlock-express')
var glx = require('./').create({

  version: 'draft-11'                                       // Let's Encrypt v2 is ACME draft 11

, server: 'https://acme-v02.api.letsencrypt.org/directory'  // If at first you don't succeed, stop and switch to staging
                                                            // https://acme-staging-v02.api.letsencrypt.org/directory

, configDir: process.argv[4] || '~/.config/acme/'           // You MUST have access to write to directory where certs
                                                            // are saved. ex: /home/foouser/.config/acme

, approveDomains: myApproveDomains                          // Greenlock's wraps around tls.SNICallback. Check the
                                                            // domain name here and reject invalid ones

, app: myVhostApp                                           // Any node-style http app (i.e. express, koa, hapi, rill)

  /* CHANGE TO A VALID EMAIL */
, email: process.argv[2] || 'jon.doe@example.com'           // Email for Let's Encrypt account and Greenlock Security
, agreeTos: true                                            // Accept Let's Encrypt ToS
//, communityMember: true                                   // Join Greenlock to get important updates, no spam

//, debug: true

});

var server = glx.listen(80, 443);
server.on('listening', function () {
  console.info(server.type + " listening on", server.address());
});

function myApproveDomains(opts, certs, cb) {
  console.log('sni:', opts.domain);
  // In this example the filesystem is our "database".
  // We check in /srv/www for whatever.com and if it exists, it's allowed

  // SECURITY Greenlock validates opts.domains ahead-of-time so you don't have to
  return checkWwws(opts.domains[0]).then(function () {
    //opts.email = email;
    opts.agreeTos = true;
    cb(null, { options: opts, certs: certs });
  }).catch(cb);
}

function checkWwws(_hostname) {
  if (!_hostname) {
    // SECURITY, don't allow access to the 'srv' root
    // (greenlock-express uses middleware to check '..', etc)
    return '';
  }
  var hostname = _hostname;
  var _hostdir = path.join(srv, hostname);
  var hostdir = _hostdir;
  // TODO could test for www/no-www both in directory
  return fs.readdir(hostdir).then(function () {
    // TODO check for some sort of htaccess.json and use email in that
    // NOTE: you can also change other options such as `challengeType` and `challenge`
    // opts.challengeType = 'http-01';
    // opts.challenge = require('le-challenge-fs').create({});
    return hostname;
  }).catch(function () {
    if ('www.' === hostname.slice(0, 4)) {
      // Assume we'll redirect to non-www if it's available.
      hostname = hostname.slice(4);
      hostdir = path.join(srv, hostname);
      return fs.readdir(hostdir).then(function () {
        // TODO list both domains?
        return hostname;
      });
    } else {
      // Or check and see if perhaps we should redirect non-www to www
      hostname = 'www.' + hostname;
      hostdir = path.join(srv, hostname);
      return fs.readdir(hostdir).then(function () {
        // TODO list both domains?
        return hostname;
      });
    }
  }).catch(function () {
    throw new Error("rejecting '" + _hostname + "' because '" + _hostdir + "' could not be read");
  });
}

function myVhostApp(req, res) {
  // SECURITY greenlock pre-sanitizes hostnames to prevent unauthorized fs access so you don't have to
  // (also: only domains approved above will get here)
  console.log('vhost:', req.headers.host);
  if (!req.headers.host) {
    // SECURITY, don't allow access to the 'srv' root
    // (greenlock-express uses middleware to check '..', etc)
    return res.end();
  }

  // We could cache wether or not a host exists for some amount of time
  var fin = finalhandler(req, res);
  return checkWwws(req.headers.host).then(function (hostname) {
    if (hostname !== req.headers.host) {
      res.statusCode = 302;
      res.setHeader('Location', 'https://' + hostname);
      // SECURITY this is safe only because greenlock disallows invalid hostnames
      res.end("<!-- redirecting to https://" + hostname + "-->");
      return;
    }
    var serve = serveStatic(path.join(srv, hostname), { redirect: true });
    serve(req, res, fin);
  }).catch(function () {
   fin();
  });
}
