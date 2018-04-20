| Sponsored by [ppl](https://ppl.family)
| [greenlock (lib)](https://git.coolaj86.com/coolaj86/greenlock.js)
| [greenlock-cli](https://git.coolaj86.com/coolaj86/greenlock-cli.js)
| **greenlock-express**
| [greenlock-cluster](https://git.coolaj86.com/coolaj86/greenlock-cluster.js)
| [greenlock-koa](https://git.coolaj86.com/coolaj86/greenlock-koa.js)
| [greenlock-hapi](https://git.coolaj86.com/coolaj86/greenlock-hapi.js)
|

greenlock-express.js
=================

(formerly letsencrypt-express)

Free SSL for node.js.

Fully automatic HTTPS with Express.js
(and all other middleware systems), including virtual hosting (vhost) support with multiple domains.

Certificate renewals happen in the background between 10 and 14 days before expiration (~78 days).

## Now supports Let's Encrypt v2!!

* Let's Encrypt v1 (aka v01)
* Let's Encrypt v2 (aka v02 or ACME draft 11)
* ACME draft 11 (ACME v2 is a misnomer)
* Wildcard domains!! (via dns-01 challenges)
  * `*.example.com`

Install
=======

```bash
npm install --save greenlock-express@2.x
```

QuickStart
==========

Here's a completely working example that will get you started.

All you have to do is start the webserver and then visit it at its domain name.

`app.js`:
```javascript
'use strict';

require('greenlock-express').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

  // You MUST change 'acme-staging-v02' to 'acme-v02' in production
, server: 'https://acme-staging-v02.api.letsencrypt.org/directory'  // staging

  // You MUST change this to a valid email address
, email: 'john.doe@example.com'

  // You MUST NOT build clients that accept the ToS without asking the user
, agreeTos: true

  // You MUST change these to valid domains
  // NOTE: all domains will validated and listed on the certificate
, approveDomains: [ 'example.com', 'www.example.com' ]

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: require('path').join(require('os').homedir(), 'acme', 'etc')

, app: require('express')().use('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('Hello, World!\n\n💚 🔒.js');
  })

//, debug: true

}).listen(80, 443);
```

### What if the example didn't work?

First and foremost:

* You MUST run this on the public-facing webserver, *as the webserver* (exception: using a 'dns-01' challenge, such as `le-challenge-route53`, you can validate domains set to private addresses )

Double check the following:

* **Public Facing IP** for `http-01` challenges
  * Are you running this *as* a public-facing webserver (good)? or localhost (bad)?
  * Does `ifconfig` show a public address (good)? or a private one - 10.x, 192.168.x, etc (bad)?
  * If you're on a non-public server, are you using the `dns-01` challenge?
* **correct ACME version**
  * Let's Encrypt **v2** (ACME v2) must use `version: 'draft-11'`
  * Let's Encrypt v1 must use `version: 'v01'`
* **valid email**
  * You MUST set `email` to a **valid address**
  * MX records must validate (`dig MX example.com` for `'john@example.com'`)
* **valid DNS records**
  * You MUST set `approveDomains` to real domains
  * Must have public DNS records (test with `dig +trace A example.com; dig +trace www.example.com` for `[ 'example.com', 'www.example.com' ]`)
* **write access**
  * You MUST set `configDir` to a writeable location (test with `touch ~/acme/etc/tmp.tmp`)
* **port binding privileges**
  * You MUST be able to bind to ports 80 and 44
  * You can do this via `sudo` or [`setcap`](https://gist.github.com/firstdoit/6389682)
* **API limits**
  * You MUST NOT exceed the API [**usage limits**](https://letsencrypt.org/docs/staging-environment/) per domain, certificate, IP address, etc
* **Red Lock, Untrusted**
  * You MUST change the `server` value **in production**
  * Shorten the 'acme-staging-v02' part of the server URL to 'acme-v02'

### Get it working in staging first!

There are a number of common problems related to system configuration -
firewalls, ports, permissions, etc - that you are likely to run up against
when using greenlock for your first time.

In order to avoid being blocked by hitting rate limits with bad requests,
you should always test against the `staging` server
(`https://acme-staging-v02.api.letsencrypt.org/directory`) first.

Usage
=====

The oversimplified example was the bait
(because everyone seems to want an example that fits in 3 lines, even if it's terribly bad practices),
now here's the switch:

`serve.js`:
```javascript
'use strict';

// returns an instance of greenlock.js with additional helper methods
var lex = require('greenlock-express').create({
  // set to https://acme-v02.api.letsencrypt.org/directory in production
  server: 'https://acme-staging-v02.api.letsencrypt.org/directory'
, version: 'draft-11' // Let's Encrypt v2 (ACME v2)

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

The Automatic Certificate Issuance is initiated via SNI (`httpsOptions.SNICallback`).
For security, domain validation MUST have an approval callback in *production*.

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

The API is actually located at [greenlock.js options](https://git.coolaj86.com/coolaj86/greenlock.js)
(because all options are simply passed through to `greenlock.js` proper without modification).

The only "API" consists of two options, the rest is just a wrapper around `greenlock.js` to take LOC from 15 to 5:

* `opts.app` An express app in the format `function (req, res) { ... }` (no `next`).
* `lex.listen(plainPort, tlsPort)` Accepts port numbers (or arrays of port numbers) to listen on.

Brief overview of some simple options for `greenlock.js`:

* `opts.server` set to https://acme-v02.api.letsencrypt.org/directory in production
* `opts.version` set to `v01` for Let's Encrypt v1 or `draft-11` for Let's Encrypt v2 (mistakenly called ACME v2)
* `opts.email` The default email to use to accept agreements.
* `opts.agreeTos` When set to `true`, this always accepts the LetsEncrypt TOS. When a string it checks the agreement url first.
* `opts.approveDomains` can be either of:
  * An explicit array of allowed domains such as `[ 'example.com', 'www.example.com' ]`
  * A callback `function (opts, certs, cb) { cb(null, { options: opts, certs: certs }); }` for setting `email`, `agreeTos`, `domains`, etc (as shown in usage example above)
* `opts.renewWithin` is the **maximum** number of days (in ms) before expiration to renew a certificate.
* `opts.renewBy` is the **minimum** number of days (in ms) before expiration to renew a certificate.
