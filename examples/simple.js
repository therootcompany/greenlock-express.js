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

, debug: true

}).listen(80, 443);
