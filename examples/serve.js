'use strict';

//var le = require('letsencrypt-express');
var le = require('../').testing();
var express = require('express');
var app = express();

app.use(function (req, res) {
  res.send({ success: true });
});

le.create('./letsencrypt.config', app).listen([80], [443, 5001]);
