// First and foremost:
// I'm not a fan of `socket.io` because it's huge and complex.
// I much prefer `ws` because it's very simple and easy.
// That said, it's popular.......
'use strict';

//var greenlock = require('greenlock-express');
var greenlock = require('../');
var options = require('./greenlock-options.js');
var socketio = require('socket.io');
var server;
var io;

// Any node http app will do - whether express, raw http or whatever
options.app = require('express')().use('/', function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('Hello, World!\n\n💚 🔒.js');
});

// The server that's handed back from `listen` is a raw https server
server = greenlock.create(options).listen(80, 443);
io = socketio(server);

// Then you do your socket.io stuff
io.on('connection', function (socket) {
  console.log('a user connected');
  socket.emit('Welcome');

  socket.on('chat message', function (msg) {
    socket.broadcast.emit('chat message', msg);
  });
});
