'use strict';

//require('letsencrypt-express')
require('../').create({

  server: 'staging'

, email: 'john.doe@example.com'

, agreeTos: true

, approvedDomains: [ 'example.com', 'www.example.com' ]

, app: require('express')().use('/', function (req, res) {
    res.end('Hello, World!');
  })

, renewWithin: (91 * 24 * 60 * 60 * 1000)
, renewBy: (90 * 24 * 60 * 60 * 1000)

, debug: true
}).listen(80, 443);
