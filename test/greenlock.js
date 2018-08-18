#!/usr/bin/env node
var Greenlock = require('../');
var greenlock = Greenlock.create({
  version: 'draft-11'
, server: 'https://acme-staging-v02.api.letsencrypt.org/directory'
, agreeTos: true
, approveDomains: [ 'example.com', 'www.example.com' ]
, configDir: require('path').join(require('os').tmpdir(), 'acme')

, app: require('express')().use('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('Hello, World!\n\n💚 🔒.js');
  })
});

var server1 = greenlock.listen(5080, 5443);
server1.on('listening', function () {
  console.log("### THREE 3333 - All is well server1", this.address());
  server1.close();
});
setTimeout(function () {
  var server2 = greenlock.listen(6080, 6443, function () {
    console.log("### FIVE 55555 - Started server 2!");
    setTimeout(function () {
      server2.close();
      // TODO greenlock needs a close event (and to listen to its server's close event)
      process.exit(0);
    }, 1000);
  });
  server2.on('listening', function () {
    console.log("### FOUR 44444 - All is well server2", server2.address());
  });
}, 1000);

var server3 = greenlock.listen(7080, 22, function () {
  // ignore
});
server3.on('error', function () {
  console.log("Success: caught expected error");
  server3.close();
});
