'use strict';

//require('letsencrypt-express')
require('../').create({

  server: 'staging'

, email: 'aj@daplie.com'

, agreeTos: true

, approvedDomains: [ 'pokemap.hellabit.com', 'www.pokemap.hellabit.com' ]

, app: require('express')().use('/', function (req, res) {
    res.end('Hello, World!');
  })

, debug: true

}).listen(80, 443);
