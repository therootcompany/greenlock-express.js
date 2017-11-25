greenlock-express (letsencrypt-express)
=================

| [greenlock (lib)](https://git.coolaj86.com/coolaj86/greenlock.js)
| [greenlock-cli](https://git.coolaj86.com/coolaj86/greenlock-cli.js)
| **greenlock-express**
| [greenlock-cluster](https://git.coolaj86.com/coolaj86/greenlock-cluster.js)
| [greenlock-koa](https://git.coolaj86.com/coolaj86/greenlock-koa.js)
| [greenlock-hapi](https://git.coolaj86.com/coolaj86/greenlock-hapi.js)
|

Free SSL and managed or automatic HTTPS for node.js with Express, Koa, Connect, Hapi, and all other middleware systems.

* Automatic Registration via SNI (`httpsOptions.SNICallback`)
  * **registrations** require an **approval callback** in *production*
* Automatic Renewal (around 80 days)
  * **renewals** are *fully automatic* and happen in the *background*, with **no downtime**
* Automatic vhost / virtual hosting

All you have to do is start the webserver and then visit it at its domain name.

Install
=======

```bash
npm install --save greenlock-express@2.x
```

**Important**: Use node v4.5+ or v6.x, node <= v4.4 has a [known bug](https://github.com/nodejs/node/issues/8053) in the `Buffer` implementation.

QuickStart
==========

Here's a completely working example that will get you started:

`app.js`:
```javascript
'use strict';

require('greenlock-express').create({

  server: 'staging'

, email: 'john.doe@example.com'

, agreeTos: true

, approveDomains: [ 'example.com' ]

, app: require('express')().use('/', function (req, res) {
    res.end('Hello, World!');
  })

}).listen(80, 443);
```

Certificates will be stored in `~/letsencrypt`.

**Important**:

You must set `server` to `https://acme-v01.api.letsencrypt.org/directory` **after**
you have tested that your setup works.

Why You Must Use 'staging' First
--------------------------------

There are a number of common problems related to system configuration -
firewalls, ports, permissions, etc - that you are likely to run up against
when using greenlock for your first time.

In order to avoid being blocked by hitting rate limits with bad requests,
you should always test against the `'staging'` server
(`https://acme-staging.api.letsencrypt.org/directory`) first.

Migrating from v1.x
===================

Whereas v1.x had a few hundred lines of code, v2.x is a single small file of about 50 lines.

A few important things to note:

* Delete your v1.x `~/letsencrypt` directory, otherwise you get this:
  * `{ type: 'urn:acme:error:malformed', detail: 'Parse error reading JWS', status: 400 }`
* `approveRegistration` has been replaced by `approveDomains`
* All of the behavior has moved to the various plugins, which each have their own options
* Use https and http directly, don't rely on the silly `.listen()` helper. It's just there for looks.
* `lex.createAcmeResponder()` is now `lex.middleware(require('redirect-https')())` or `lex.middleware(app)`

Usage
=====

The oversimplified example was the bait
(because everyone seems to want an example that fits in 3 lines, even if it's terribly bad practices),
now here's the switch:

`serve.js`:
```javascript
'use strict';

// returns an instance of node-greenlock with additional helper methods
var lex = require('greenlock-express').create({
  // set to https://acme-v01.api.letsencrypt.org/directory in production
  server: 'staging'

// If you wish to replace the default plugins, you may do so here
//
, challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' }) }
, store: require('le-store-certbot').create({ webrootPath: '/tmp/acme-challenges' })

// You probably wouldn't need to replace the default sni handler
// See https://git.coolaj86.com/coolaj86/le-sni-auto if you think you do
//, sni: require('le-sni-auto').create({})

, approveDomains: approveDomains
});
```

```javascript
function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such


  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    opts.domains = certs.altnames;
  }
  else {
    opts.email = 'john.doe@example.com';
    opts.agreeTos = true;
  }

  // NOTE: you can also change other options such as `challengeType` and `challenge`
  // opts.challengeType = 'http-01';
  // opts.challenge = require('le-challenge-fs').create({});

  cb(null, { options: opts, certs: certs });
}
```


```javascript
// handles acme-challenge and redirects to https
require('http').createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});



var app = require('express')();
app.use('/', function (req, res) {
  res.end('Hello, World!');
});

// handles your app
require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
  console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
});
```

**Security Warning**:

If you don't do proper checks in `approveDomains(opts, certs, cb)`
an attacker will spoof SNI packets with bad hostnames and that will
cause you to be rate-limited and or blocked from the ACME server.


API
===

This module is an elaborate ruse (to provide an oversimplified example and to nab some SEO).

The API is actually located at [node-greenlock options](https://git.coolaj86.com/coolaj86/greenlock.js)
(because all options are simply passed through to `node-greenlock` proper without modification).

The only "API" consists of two options, the rest is just a wrapper around `node-greenlock` to take LOC from 15 to 5:

* `opts.app` An express app in the format `function (req, res) { ... }` (no `next`).
* `lex.listen(plainPort, tlsPort)` Accepts port numbers (or arrays of port numbers) to listen on.

Brief overview of some simple options for `node-greenlock`:

* `opts.server` set to https://acme-v01.api.letsencrypt.org/directory in production
* `opts.email` The default email to use to accept agreements.
* `opts.agreeTos` When set to `true`, this always accepts the LetsEncrypt TOS. When a string it checks the agreement url first.
* `opts.approveDomains` can be either of:
  * An explicit array of allowed domains such as `[ 'example.com', 'www.example.com' ]`
  * A callback `function (opts, certs, cb) { cb(null, { options: opts, certs: certs }); }` for setting `email`, `agreeTos`, `domains`, etc (as shown in usage example above)
* `opts.renewWithin` is the **maximum** number of days (in ms) before expiration to renew a certificate.
* `opts.renewBy` is the **minimum** number of days (in ms) before expiration to renew a certificate.
