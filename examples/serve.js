'use strict';

// Note: using staging server url, remove .testing() for production
var lex = require('letsencrypt-express').testing();
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.send({ success: true });
});

lex.create('./letsencrypt.config', app).listen([80], [443, 5001], function () {
  console.log("ENCRYPT __ALL__ THE DOMAINS!");
});
