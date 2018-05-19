#!/usr/bin/env node
'use strict';

// This is an example for virtual hosting

var email = 'john@example.com';
// The prefix where sites go by name.
// For example: whatever.com may live in /srv/www/whatever.com, thus /srv/www is our path
var srv = '/srv/www/';


var fs = require('fs');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var path = require('path');
var hostnameRe = /^[a-z0-9][\.a-z0-9\-]+$/;

//require('greenlock-express')
require('../').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory

, approveDomains: function (opts, certs, cb) {
    // In this example the filesystem is our "database".
    // We check in /srv/www for whateve.com and if it exists, it's allowed


    // The domains being approved for the first time are listed in opts.domains

    // Certs being renewed are listed in certs.altnames
    if (certs) {
      opts.domains = certs.altnames;
      cb(null, { options: opts, certs: certs });
      return;
    }

    // TODO could test for www/no-www both in directory and IP
    var e;
    var hostdir = path.join(srv, opts.domains[0]);
    if (!hostnameRe.test(opts.domains[0])) {
      e = new Error("rejecting '" + opts.domains[0] + "' because it is not a valid domain name");
      cb(e);
      return;
    }
    fs.readdir(hostdir, function (err, nodes) {
      e = new Error("rejecting '" + opts.domains[0] + "' because '" + hostdir + "' could not be read");
      if (err || !nodes) {
        console.error(err);
        console.error(e);
        cb(e);
        return;
      }

      // TODO check for some sort of htaccess.json and use email in that
      // NOTE: you can also change other options such as `challengeType` and `challenge`
      // opts.challengeType = 'http-01';
      // opts.challenge = require('le-challenge-fs').create({});
      opts.email = email;
      opts.agreeTos = true;
      cb(null, { options: opts, certs: certs });
    });

  }

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: require('path').join(require('os').homedir(), 'acme', 'etc')

, app: function (req, res) {
    console.log(req.headers.host);
    var hostname = (req.headers.host||'').toLowerCase().split(':')[0];
    // sanatize hostname to prevent unauthorized fs access
    if (!hostnameRe.test(hostname)) {
      res.statusCode = 404;
      res.end('Bad Hostname');
      return;
    }

    var serve = serveStatic(path.join(srv, hostname), { redirect: true });
    serve(req, res, finalhandler(req, res));
  }

  // Get notified of important updates and help me make greenlock better
, communityMember: true

//, debug: true

}).listen(80, 443);
