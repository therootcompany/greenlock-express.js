[![Join the chat at https://gitter.im/Daplie/letsencrypt-express](https://badges.gitter.im/Daplie/letsencrypt-express.svg)](https://gitter.im/Daplie/letsencrypt-express?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

| [letsencrypt (library)](https://github.com/Daplie/node-letsencrypt)
| [letsencrypt-cli](https://github.com/Daplie/letsencrypt-cli) 
| **letsencrypt-express**
| [letsencrypt-koa](https://github.com/Daplie/letsencrypt-koa)
| [letsencrypt-hapi](https://github.com/Daplie/letsencrypt-hapi)
|

# HELP WANTED

There are a number of easy to fix bugs (the most important of which is basically requires tracing some functions, doing some console.log-ing and returning the right type of object).

If you've got some free cycles to help, I can guide you through the process, I'm just still too busy to fix them right now and the workarounds work mentioned in the comments work.

Email me coolaj86@gmail.com if you want to help.

# LetsEncrypt Express

[![Join the chat at https://gitter.im/Daplie/letsencrypt-express](https://badges.gitter.im/Daplie/letsencrypt-express.svg)](https://gitter.im/Daplie/letsencrypt-express?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Free SSL and managed or automatic HTTPS for node.js with Express, Koa, Connect, Hapi, and all other middleware systems.

* Automatic Registration via SNI (`httpsOptions.SNICallback`)
  * **registrations** require an **approval callback** in *production*
* Automatic Renewal (around 80 days)
  * **renewals** are *fully automatic* and happen in the *background*, with **no downtime**
* Automatic vhost / virtual hosting

All you have to do is start the webserver and then visit it at it's domain name.

## Install

```
npm install --save letsencrypt-express
```

## Usage

* standalone
* express
* http / https
* http / http2 / spdy
* koa

### Setup (same for all examples) 

```javascript
'use strict';

/* Note: using staging server url, remove .testing() for production
Using .testing() will overwrite the debug flag with true */ 
var LEX = require('letsencrypt-express').testing();

// Change these two lines!
var DOMAIN = 'myservice.example.com';
var EMAIL = 'user@example.com';

var lex = LEX.create({
  configDir: require('os').homedir() + '/letsencrypt/etc'
, approveRegistration: function (hostname, approve) { // leave `null` to disable automatic registration
    if (hostname === DOMAIN) { // Or check a database or list of allowed domains
      approve(null, {
        domains: [DOMAIN]
      , email: EMAIL
      , agreeTos: true
      });
    }
  }
});
```

WARNING: If you don't do any checks and simply complete `approveRegistration` callback, an attacker will spoof SNI packets with bad hostnames and that will cause you to be rate-limited and or blocked from the ACME server. Alternatively, You can run registration *manually*:

```bash
npm install -g letsencrypt-cli

letsencrypt certonly --standalone \
  --config-dir ~/letsencrypt/etc \
  --agree-tos --domains example.com --email user@example.com
  
# Note: the '--webrootPath' option is also available if you don't want to shut down your webserver to get the cert.
```

### Standalone

```javascript
lex.onRequest = function (req, res) {
  res.end('Hello, World!');
};

lex.listen([80], [443, 5001], function () {
  console.log("ENCRYPT __ALL__ THE DOMAINS!");
});

// NOTE:
// `~/letsencrypt/etc` is the default `configDir`
// ports 80, 443, and 5001 are the default ports to listen on.
```

## Express

```bash
npm install --save spdy
```

```javascript
// A happy little express app
var express = require('express');
var app = express();

app.use(function (req, res) {
  res.send({ success: true });
});

lex.onRequest = app;

lex.listen([80], [443, 5001], function () {
  var protocol = ('requestCert' in this) ? 'https': 'http';
  console.log("Listening at " + protocol + '://localhost:' + this.address().port);
});
```

### Use with raw http / https modules

Let's say you want to redirect all http to https.

```javascript
var http = require('http');
var https = require('spdy');
// NOTE: you could use the old https module if for some reason you don't want to support modern browsers

function redirectHttp() {
  http.createServer(LEX.createAcmeResponder(lex, function redirectHttps(req, res) {
    res.setHeader('Location', 'https://' + req.headers.host + req.url);
    res.statusCode = 302; // use 307 if you want to redirect requests with POST, DELETE or PUT action.
    res.end('<!-- Hello Developer Person! Please use HTTPS instead -->');
  })).listen(80);
}

function serveHttps() {
  var app = require('express')();
  
  app.use('/', function (req, res) {
    res.end('Hello!');
  });
  
  https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app)).listen(443);
}

redirectHttp();
serveHttps();
```

### Let's Encrypt with Koa

```javascript
var http = require('http');
var https = require('spdy');       // Note: some have reported trouble with `http2` and success with `spdy`
var koa = require('koa');
var app = koa();
var redirectHttps = koa().use(require('koa-sslify')()).callback();

app.use(function *() {
  this.body = 'Hello World';
});

var server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app.callback()));
var redirectServer = http.createServer(LEX.createAcmeResponder(lex, redirectHttps)));

server.listen(443, function () {
 console.log('Listening at https://localhost:' + this.address().port);
});

redirectServer.listen(80, function () {
  console.log('Redirecting insecure traffic from http://localhost:' + this.address().port + ' to https');
});
```

### WebSockets with Let's Encrypt

Note: you don't need to create websockets for the plain ports.

```javascript
var WebSocketServer = require('ws').Server;
var https = require('spdy');
var server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app));
var wss = new WebSocketServer({ server: server });

wss.on('connection', onConnection);
server.listen(443);

function onConnection(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
}
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


                                // registrations are NOT approved automatically by default due to security concerns
  , approveRegistration: func   // (someone can spoof servername indication to your server and cause you to be rate-limited)
                                // but you can implement handling of them if you wish
                                // (note that you should probably call the callback immediately with a tlsContext)
                                //
                                // default    function (hostname, cb) { cb(null, null); }
                                //
                                // example    function (hostname, cb) {
                                //              cb(null, { domains: [hostname], agreeTos: true, email: 'user@example.com' });
                                //            }


  , handleRenewFailure: func    // renewals are automatic, but sometimes they may fail. If that happens, you should handle it
                                // (note that renewals happen in the background)
                                //
                                // default    function (err, letsencrypt, hostname, certInfo) {}
  }


                                // uses `opts.webrootPath` to read from the filesystem
LEX.getChallenge(opts, hostname, key cb)

LEX.createAcmeResponder(opts, fn)  // this will return the necessary request handler for /.well-known/acme-challenges
                                   // which then calls `fn` (such as express app) to complete the request
                                   //
                                   // opts     lex instance created with LEX.create(opts)
                                   //         more generally, any object with a compatible `getChallenge` will work:
                                   //         `lex.getChallenge(opts, domain, key, function (err, val) {})`
                                   //
                                   // fn       function (req, res) {
                                   //            console.log(req.method, req.url);
                                   //
                                   //            res.end('Hello!');
                                   //          }
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

## More Examples

### < 140 Characters

Let's Encrypt in 128 characters, with spaces!

```
node -e 'require("letsencrypt-express").testing().create( require("express")().use(function (_, r) { r.end("Hi!") }) ).listen()'
```

### More realistic

```javascript
'use strict';

// Note: using staging server url, remove .testing() for production
var LEX = require('letsencrypt-express').testing();
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.send({ success: true });
});

LEX.create({
  configDir: './letsencrypt.config'                 // ~/letsencrypt, /etc/letsencrypt, whatever you want

, onRequest: app                                    // your express app (or plain node http app)

, letsencrypt: null                                 // you can provide you own instance of letsencrypt
                                                    // if you need to configure it (with an agreeToTerms
                                                    // callback, for example)

, approveRegistration: function (hostname, cb) {    // PRODUCTION MODE needs this function, but only if you want
                                                    // automatic registration (usually not necessary)
                                                    // renewals for registered domains will still be automatic
    cb(null, {
      domains: [hostname]
    , email: 'user@example.com'
    , agreeTos: true              // you
    });
  }
}).listen([80], [443, 5001], function () {
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


### All Options Exposed

Here's absolutely every option and function exposed

```javascript
var http = require('http');
var https = require('spdy');
var LEX = require('letsencrypt-express');
var LE = require('letsencrypt');
var lex;

lex = LEX.create({
  webrootPath: '/tmp/.well-known/acme-challenge'

, lifetime: 90 * 24 * 60 * 60 * 1000    // expect certificates to last 90 days
, failedWait: 5 * 60 * 1000             // if registering fails wait 5 minutes before trying again
, renewWithin: 3 * 24 * 60 * 60 * 1000  // renew at least 3 days before expiration
, memorizeFor: 1 * 24 * 60 * 60 * 1000  // keep certificates in memory for 1 day

, approveRegistration: function (hostname, cb) {
    cb(null, {
      domains: [hostname]
    , email: 'user@example.com'
    , agreeTos: true
    });
  }

, handleRenewFailure: function (err, hostname, certInfo) {
    console.error("ERROR: Failed to renew domain '", hostname, "':");
    if (err) {
      console.error(err.stack || err);
    }
    if (certInfo) {
      console.error(certInfo);
    }
  }

, letsencrypt: LE.create(
    // options
    { configDir: './letsencrypt.config'
    , manual: true

    , server: LE.productionServerUrl
    , privkeyPath: LE.privkeyPath
    , fullchainPath: LE.fullchainPath
    , certPath: LE.certPath
    , chainPath: LE.chainPath
    , renewalPath: LE.renewalPath
    , accountsDir: LE.accountsDir

    , debug: false
    }

    // handlers
  , { setChallenge: LEX.setChallenge
    , removeChallenge: LEX.removeChallenge
    }
  )

, debug: false
});

http.createServer(LEX.createAcmeResponder(lex, function (req, res) {
  res.setHeader('Location', 'https://' + req.headers.host + req.url);
  res.end('<!-- Hello Mr Developer! Please use HTTPS instead -->');
}));

https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, function (req, res) {
  res.end('Hello!');
}));
```

## Heroku?

This doesn't work on heroku because heroku uses a proxy with built-in https
(which is a smart thing to do) and besides, they want you to pay big bucks
for https. (hopefully not for long?...)
