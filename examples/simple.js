'use strict';

//require('greenlock-express')
require('../').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

  // You MUST change 'acme-staging-v02' to 'acme-v02' in production
, server: 'https://acme-staging-v02.api.letsencrypt.org/directory'  // staging

  // You MUST change this to a valid email address
, email: 'john.doe@example.com'

  // You MUST NOT build clients that accept the ToS without asking the user
, agreeTos: true

  // You MUST change these to valid domains
  // NOTE: all domains will validated and listed on the certificate
, approveDomains: [ 'example.com', 'www.example.com' ]

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: require('path').join(require('os').homedir(), 'acme', 'etc')

, app: require('express')().use('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('Hello, World!\n\n💚 🔒.js');
  })

//, debug: true

}).listen(80, 443);
