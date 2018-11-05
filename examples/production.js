'use strict';

//
// My Secure Server
//
//var greenlock = require('greenlock-express')
var greenlock = require('../').create({

  // Let's Encrypt v2 is ACME draft 11
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory
  server: 'https://acme-v02.api.letsencrypt.org/directory'
, version: 'draft-11'
  // You MUST have write access to save certs
, configDir: '~/.config/acme/'

// The previous 'simple' example set these values statically,
// but this example uses approveDomains() to set them dynamically
//, email: 'none@see.note.above'
//, agreeTos: false

  // approveDomains is the right place to check a database for
  // email addresses with domains and agreements and such
, approveDomains: approveDomains

, app: require('./my-express-app.js')

  // Get notified of important updates and help me make greenlock better
, communityMember: true

//, debug: true

});

var server = greenlock.listen(80, 443);


//
// My Secure Database Check
//
function approveDomains(opts, certs, cb) {

  // Only one domain is listed with *automatic* registration via SNI
  // (it's an array because managed registration allows for multiple domains,
  //                                which was the case in the simple example)
  console.log(opts.domains);

  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    opts.domains = [certs.subject].concat(certs.altnames);
  }

  fooCheckDb(opts.domains, function (err, agree, email) {
    if (err) { cb(err); return; }

    // Services SHOULD automatically accept the ToS and use YOUR email
    // Clients MUST NOT accept the ToS without asking the user
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
    cb(new Error('domain not allowed'));
  } else {
    cb(null, userAgrees, userEmail);
  }
}
