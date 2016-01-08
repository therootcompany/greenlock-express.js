# LetsEncrypt Express

Free SSL and managed or automatic HTTPS for node.js with Express, Koa, Connect, and other middleware systems.


## Install

```
npm install --save letsencrypt-express
```

## Usage

**Minimal**

```javascript
'use strict';

// Note: using staging server url, remove .testing() for production
var lex = require('letsencrypt-express').testing();

var express = require('express');
var app = express();


// A happy little express app
app.use(function (req, res) {
  res.send({ success: true });
});


// assumes ~/letsencrypt/etc as the configDir and ports 80, 443, and 5001 by default
lex.create(app).listen();
```

## How Automatic?

**Extremely**.

* **renewals** are *fully automatic* and happen in the *background*, with **no downtime**
* **registrations** are automatic in *testing*, but require a **approval callback** in *production*

**testing mode**

All you have to do is start the webserver and then visit it at it's domain name.
The certificate will be retrieved automatically. Renewals and Registrations are automatic.

**production mode**

You can run **registration** manually:

```bash
npm install -g letsencrypt-cli

letsencrypt certonly --standalone \
  --config-dir ~/letsencrypt/etc \
  --agree-tos --domains example.com --email user@example.com
```

(note that the `--webrootPath` option is also available if you don't want to shut down your webserver to get the cert)

Or you can approve registrations with the `opts.approveRegistration(domain, cb)`callback:

```javascript
{ configDir: '...'
// ...
, approveRegistration: function (hostname, cb) {
    // check a database or something, get the user
    // show them the agreement that you've already downloaded
    cb(null, {
      domains: [hostname]
    , email: 'user@example.com'
    , agreeTos: true
    });
  }
}
```

(if you don't check and simply complete the callback, an attacker will spoof SNI packets with bad hostnames
and that will cause you to be rate-limited and or blocked from the ACME server)

## Examples

### < 140 Characters

Let's Encrypt in 128 characters, with spaces!

```
node -e 'require("letsencrypt-express").testing().create( require("express")().use(function (_, r) { r.end("Hi!") }) ).listen()'
```

### More realistic

```javascript
'use strict';

// Note: using staging server url, remove .testing() for production
var lex = require('letsencrypt-express').testing();
var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.send({ success: true });
});

lex.create({
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

### Using with Koa

```javascript
'use strict';

// Note: using staging server url, remove .testing() for production
var lex = require('letsencrypt-express').testing();
var koa = require('koa');
var app = koa();


app.use(function *(){
  this.body = 'Hello World';
});

lex.create({
  configDir: './letsencrypt.config'                 // ~/letsencrypt, /etc/letsencrypt, whatever you want

, onRequest: app.callback()                         // your koa app callback

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
}).listen([], [4443], function () {
  var server = this;
  var protocol = ('requestCert' in server) ? 'https': 'http';
  console.log("Listening at " + protocol + '://localhost:' + this.address().port);
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

```javascript
var WebSocketServer = require('ws').Server;

results.tlsServers.forEach(function (server) {
  var wss = new WebSocketServer({ server: server });
  wss.on('connection', onConnection);
});

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
