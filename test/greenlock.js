#!/usr/bin/env node
var Greenlock = require('../');
var greenlock = Greenlock.create({
  version: 'draft-11'
, server: 'https://acme-staging-v02.api.letsencrypt.org/directory'
, agreeTos: true
, approvedDomains: [ 'example.com', 'www.example.com' ]
, configDir: require('path').join(require('os').tmpdir(), 'acme')

, app: require('express')().use('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('Hello, World!\n\n💚 🔒.js');
  })
});

var server1 = greenlock.listen(5080, 5443);
server1.on('listening', function () {
  console.log("### THREE 3333 - All is well server1", this.address());
  setTimeout(function () {
    // so that the address() object doesn't disappear
    server1.close();
    server1.unencrypted.close();
  }, 10);
});
setTimeout(function () {
  var server2 = greenlock.listen(6080, 6443, function () {
    console.log("### FIVE 55555 - Started server 2!");
    setTimeout(function () {
      server2.close();
      server2.unencrypted.close();
      server6.close();
      server6.unencrypted.close();
      server7.close();
      server7.unencrypted.close();
      setTimeout(function () {
        // TODO greenlock needs a close event (and to listen to its server's close event)
        process.exit(0);
      }, 1000);
    }, 1000);
  });
  server2.on('listening', function () {
    console.log("### FOUR 44444 - All is well server2", server2.address());
  });
}, 1000);

var server3 = greenlock.listen(22, 22, function () {
  console.error("Error: expected to get an error when launching plain server on port 22");
}, function () {
  console.error("Error: expected to get an error when launching " + server3.type + " server on port 22");
});
server3.unencrypted.on('error', function () {
  console.log("Success: caught expected (plain) error");
});
server3.on('error', function () {
  console.log("Success: caught expected " + server3.type + " error");
  //server3.close();
});

var server4 = greenlock.listen(7080, 7443, function () {
  console.log('Success: server4: plain');
  server4.unencrypted.close();
}, function () {
  console.log('Success: server4: ' + server4.type);
  server4.close();
});

var server5 = greenlock.listen(10080, 10443, function () {
  console.log("Server 5 with one fn", this.address());
  server5.close();
  server5.unencrypted.close();
});

var server6 = greenlock.listen('[::]:11080', '[::1]:11443');

var server7 = greenlock.listen('/tmp/gl.plain.sock', '/tmp/gl.sec.sock');
