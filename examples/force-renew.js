'use strict';

//require('greenlock-express')
require('../').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory

, email: 'john.doe@example.com'

, agreeTos: true

, approvedDomains: [ 'example.com', 'www.example.com' ]

, app: require('express')().use('/', function (req, res) {
    res.end('Hello, World!');
  })

, renewWithin: (91 * 24 * 60 * 60 * 1000)
, renewBy: (90 * 24 * 60 * 60 * 1000)

  // Get notified of important updates and help me make greenlock better
, communityMember: true
, debug: true
}).listen(80, 443);
