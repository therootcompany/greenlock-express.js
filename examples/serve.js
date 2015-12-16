'use strict';

//var le = require('letsencrypt-express');
var le = require('../');
var express = require('express');
var app = express();

app.use(function (req, res) {
  res.send({ success: true });
});

le.create(app).listen([80], [443, 5001]);
