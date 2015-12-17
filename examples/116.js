'use strict';

// Don't try this at home kids, it's just for fun
// 

// require('letsencrypt-express')
require('../').testing().create(require('express')().use(function (_, r) {
  r.end('Hi!');
})).listen();
