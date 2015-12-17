# letsencrypt-express

Free SSL and Automatic HTTPS for node.js with Express, Connect, and other middleware systems

## Coming Soon

We're working on it

## In the meantime

See [examples/express-minimal.js](https://github.com/Daplie/node-letsencrypt/blob/master/examples/express-minimal.js)

## Install

```
npm install --save letsencrypt-express
```

## Examples

**Minimal**

```javascript
'use strict';

// Note: using staging server url, remove .testing() for production
var lex = require('letsencrypt-express').testing();
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.send({ success: true });
});

lex.create('/etc/letsencrypt', app).listen([80], [443, 5001], function () {
  console.log("ENCRYPT __ALL__ THE DOMAINS!");
});
```

### More Options Exposed

```javascript
'use strict';

var lex = require('letsencrypt-express');
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.send({ success: true });
});

var results = lex.create({
  configDir: '/etc/letsencrypt'
, onRequest: app
, server: require('letsencrypt').productionServerUrl
}).listen(

  // you can give just the port, or expand out to the full options
  [80, { port: 8080, address: 'localhost', onListening: function () { console.log('http://localhost'); } }]

  // you can give just the port, or expand out to the full options
, [443, 5001, { port: 8443, address: 'localhost' }]

  // this is pretty much the default onListening handler
, function onListening() {
    var server = this;
    var protocol = ('requestCert' in server) ? 'https': 'http';
    console.log("Listening at " + protocol + '://localhost:' + this.address().port);
  }
);

// In case you need access to the raw servers (i.e. using websockets)
console.log(results.plainServers);
console.log(results.tlsServers);
```

### WebSockets with Let's Encrypt

Note: you don't need to create websockets for the plain ports.

```
results.tlsServers.forEach(function (server) {
});
```

## API

```
                                // checks options and sets up defaults. returns object with `listen`
LEX.create(options)             // (it was really just done this way to appeal to what people are used to seeing)

  lex.listen(plain, tls, fn)    // actually creates the servers and causes them to listen


                                // receives an instance of letsencrypt, returns an SNICallback handler for https.createServer()
LEX.createSniCallback(opts)     // this will call letsencrypt.renew and letsencrypt.register as appropriate
                                // it will randomly stagger renewals such that they don't all happen at once on boot
                                // or at any other time. registrations will be handled as per `handleRegistration`
  opts = {
    letsencrypt: <obj>          // letsencrypt instance
  , memorizeFor: <1 day>        // how long to wait before checking the disk for updated certificates
  , renewWithin: <3 days>       // the first possible moment the certificate staggering should begin
  , failedWait:  <5 minutes>    // how long to wait before trying again if the certificate registration failed
  }


                                // uses `opts.webrootPath` to read from the filesystem
LEX.getChallenge(opts, hostname, key cb)  
```

## Options

If any of these values are `undefined` or `null` the will assume use reasonable defaults.

Partially defined values will be merged with the defaults.

Setting the value to `false` will, in many cases (as documented), disable the defaults.

```
configDir: string               // string     the letsencrypt configuration path (de facto /etc/letsencrypt)
                                //
                                // default    os.homedir() + '/letsencrypt/etc'


webrootPath: string             // string     a path to a folder where temporary challenge files will be stored and read
                                //
                                // default    os.tmpdir() + '/acme-challenge'


getChallenge: func | false      // false      do not handle getChallenge
                                //
                                // func       Example:
                                //
                                // default    function (defaults, hostname, key, cb) {
                                //              var filename = path.join(defaults.webrootPath.replace(':hostname', hostname), key);
                                //              fs.readFile(filename, 'ascii', function (cb, text) {
                                //                cb(null, text);
                                //              })
                                //            }


httpsOptions: object            // object     will be merged with internal defaults and passed to https.createServer()
                                //            { pfx, key, cert, passphrase, ca, ciphers, rejectUnauthorized, secureProtocol }
                                //            See https://nodejs.org/api/https.html
                                //            Note: if SNICallback is specified, it will be run *before*
                                //            the internal SNICallback that manages automated certificates
                                //
                                // default    uses a localhost cert and key to prevent https.createServer() from throwing an error
                                //            and also uses our SNICallback, which manages certificates


sniCallback: func               // func       replace the default sniCallback handler (which manages certificates) with your own


letsencrypt: object             // object     configure the letsencrypt object yourself and pass it in directly
                                //
                                // default    we create the letsencrypt object using parameters you specify

server: url                     // url        use letsencrypt.productionServerUrl (i.e. https://acme-v01.api.letsencrypt.org/directory)
                                //            or letsencrypt.stagingServerUrl     (i.e. https://acme-staging.api.letsencrypt.org/directory)
                                //
                                // default    production
```

## Heroku?

This doesn't work on heroku because heroku uses a proxy with built-in https
(which is a smart thing to do) and besides, they want you to pay big bucks
for https. (hopefully not for long?...)
