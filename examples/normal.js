'use strict';

//
// My Express App
//
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end('Hello, World!\n\n💚 🔒.js');
});


//
// My Secure Server
//
//require('greenlock-express')
require('../').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory

// The previous 'simple' example set these values statically,
// but this example uses approveDomains() to set them dynamically
//, email: 'none@see.note.above'
//, agreeTos: false

  // approveDomains is the right place to check a database for
  // email addresses with domains and agreements and such
, approveDomains: approveDomains

  // You MUST have access to write to directory where certs are saved
  // ex: /etc/greenlock/
, configDir: '/tmp/etc/greenlock'

, app: app

  // Get notified of important updates and help me make greenlock better
, communityMember: true

//, debug: true

}).listen(80, 443);


//
// My Secure Database Check
//
function approveDomains(opts, certs, cb) {

  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    opts.domains = certs.altnames;
    cb(null, { options: opts, certs: certs });
    return;
  }

  // Only one domain is listed with *automatic* registration via SNI
  // (it's an array because managed registration allows for multiple domains,
  //                                which was the case in the simple example)
  console.log(opts.domains);

  fooCheckDb(opts.domains, function (err, agree, email) {
    if (err) { cb(err); return; }

    // You MUST NOT build clients that accept the ToS without asking the user
    opts.agreeTos = agree;
    opts.email = email;

    // NOTE: you can also change other options such as `challengeType` and `challenge`
    // (this would be helpful if you decided you wanted wildcard support as a domain altname)
    // opts.challengeType = 'http-01';
    // opts.challenge = require('le-challenge-fs').create({});

    cb(null, { options: opts, certs: certs });
  });
}


//
// My User / Domain Database
//
function fooCheckDb(domains, cb) {
  // This is an oversimplified example of how we might implement a check in
  // our database if we have different rules for different users and domains
  var domains = [ 'example.com', 'www.example.com' ];
  var userEmail = 'john.doe@example.com';
  var userAgrees = true;
  var passCheck = opts.domains.every(function (domain) {
    return -1 !== domains.indexOf(domain);
  });

  if (!passCheck) {
    cb(new Error('domain not allowed');
  } else {
    cb(null, userAgrees, userEmail);
  }
}
