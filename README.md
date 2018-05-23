![Greenlock Logo](https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/greenlock-1063x250.png "Greenlock Logo")

!["Greenlock Function"](https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/from-not-secure-to-secure-url-bar.png "from url bar showing not secure to url bar showing secure")

Greenlock&trade; for Express.js
=================
Free SSL, Free Wildcard SSL, and Fully Automated HTTPS made dead simple<br>
<small>certificates issued by Let's Encrypt v2 via [ACME](https://git.coolaj86.com/coolaj86/acme-v2.js)</small>

!["Lifetime Downloads"](https://img.shields.io/npm/dt/greenlock.svg "Lifetime Download Count can't be shown")
!["Monthly Downloads"](https://img.shields.io/npm/dm/greenlock.svg "Monthly Download Count can't be shown")
!["Weekly Downloads"](https://img.shields.io/npm/dw/greenlock.svg "Weekly Download Count can't be shown")
!["Stackoverflow Questions"](https://img.shields.io/stackexchange/stackoverflow/t/greenlock.svg "S.O. Question count can't be shown")

| Sponsored by [ppl](https://ppl.family) |
[Greenlock&trade;](https://git.coolaj86.com/coolaj86/greenlock.js) is for
[Web Servers](https://git.coolaj86.com/coolaj86/greenlock-cli.js),
[Web Browsers](https://git.coolaj86.com/coolaj86/greenlock.html),
and **node.js middleware systems**.

Features
========

  - [x] Automatic HTTPS
    - [x] Free SSL
    - [x] Free Wildcard SSL
    - [x] Multiple domain support (up to 100 altnames per SAN)
    - [x] Dynamic Virtual Hosting (vhost)
    - [x] Automatical renewal (10 to 14 days before expiration)
  - [x] Great ACME support
    - [x] ACME draft 11
    - [x] Let's Encrypt v2
    - [x] Let's Encrypt v1
  - [x] Full node.js support
    - [x] core https module
    - [x] Express.js
    - [x] [Koa](https://git.coolaj86.com/coolaj86/greenlock-koa.js)
    - [x] [hapi](https://git.coolaj86.com/coolaj86/greenlock-hapi.js)
  - [x] Extensible Plugin Support
    - [x] AWS (S3, Route53)
    - [x] Azure
    - [x] CloudFlare
    - [x] Consul
    - [x] Digital Ocean
    - [x] etcd
    - [x] Redis

Install
=======

```bash
npm install --save greenlock-express@2.x
```

become a `communityMember`
==================

If you're the kind of person that likes the kinds of stuff that I do,
well, I want to do more of it and I'd like to get you involved.

When you set the `communityMember` option to `true` I save your
email and I'm able to inform you when there are mandatory updates
(such as with Let's Encrypt v2), notify you of important security issues,
give you early access to similar projects, and
get your feedback from time to time.

I'll also get a hash of domain names that receive and renew certificates,
which is a metric that has long interested me and may help me in getting
non-developers involved in this and future projects.

QuickStart
==========
<!--
[![Free SSL with Greenlock.js](https://i.imgur.com/Y8ix6Ts.png)](https://youtu.be/e8vaR4CEZ5s)
-->

### Screencast

Watch the QuickStart demonstration: https://youtu.be/e8vaR4CEZ5s

* [0:00](https://youtu.be/e8vaR4CEZ5s#t=0) - Intro
* [2:22](https://youtu.be/e8vaR4CEZ5s#t=142) - Demonstrating QuickStart Example
* [6:37](https://youtu.be/e8vaR4CEZ5s?t=397) - Troubleshooting / Gotchas

### Working Example Code

Here's a completely working example that will get you started.

```
git clone https://git.coolaj86.com/coolaj86/greenlock-express.js.git
pushd greenlock-express.js
  npm install
popd

# edit 'email' and 'approveDomains' in
# greenlock-express.js/examples/simple.js

node greenlock-express.js/examples/simple.js
```

All you have to do is start the webserver and then visit it at its domain name.

`app.js`:
```javascript
'use strict';

require('greenlock-express').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, switch to staging to debug
  // https://acme-staging-v02.api.letsencrypt.org/directory

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

  // Join the community to get notified of important updates and help me make greenlock better
, communityMember: true

//, debug: true

}).listen(80, 443);
```

### What if the example didn't work?

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
  * You MUST be able to bind to ports 80 and 443
  * You can do this via `sudo` or [`setcap`](https://gist.github.com/firstdoit/6389682)
* **API limits**
  * You MUST NOT exceed the API [**usage limits**](https://letsencrypt.org/docs/staging-environment/) per domain, certificate, IP address, etc
* **Red Lock, Untrusted**
  * You MUST use the **production** server url, not staging
  * The API URL should not have 'acme-staging-v02', but should have 'acme-v02'
  * Delete the `configDir` used for getting certificates in staging

### Production vs Staging

If at first you don't succeed, stop and switch to staging.

There are a number of common problems related to system configuration -
firewalls, ports, permissions, etc - that you are likely to run up against
when using greenlock for your first time.

I've put a "dry run" in place with built-in diagnostics, so hopefully
you get everything right on your first or second try.

However, in order to avoid being blocked by hitting the bad request rate limits
you should switch to using the `staging` server for any testing or debugging.

```
https://acme-staging-v02.api.letsencrypt.org/directory
```

Plugins
=====
**IMPORTANT**: Community plugins may or may not be maintained and working. Please try with the defaults before switching to community plugins.

HTTP-01 Challenges
-----------

|                | Plugin    |
|:--------------:|:---------:|
| **Default (fs)** | [le-challenge-fs](https://git.coolaj86.com/coolaj86/le-challenge-fs.js) |
| AWS S3         | [llun/le-challenge-s3](https://github.com/llun/le-challenge-s3) |
| Azure          | [kolarcz/node-le-challenge-azure-storage](https://github.com/kolarcz/node-le-challenge-azure-storage) |
| - | Build Your Own <br> [le-challenge-http-SPEC](https://git.coolaj86.com/coolaj86/le-challenge-manual.js) |
| Full List      | Search [le-challenge-](https://www.npmjs.com/search?q=le-challenge-) on npm |


DNS-01 Challenges
-----------

|                | Plugin    |
|:--------------:|:---------:|
| **Manual (cli)** | [le-challenge-dns](https://git.coolaj86.com/coolaj86/le-challenge-dns.js) |
| AWS Route 53   | [thadeetrompetter/le-challenge-route53](https://github.com/thadeetrompetter/le-challenge-route53) |
| CloudFlare     | [buschtoens/le-challenge-cloudflare](https://github.com/buschtoens/le-challenge-cloudflare) |
| CloudFlare     | [llun/le-challenge-cloudflare](https://github.com/llun/le-challenge-cloudflare) |
| Digital Ocean  | [bmv437/le-challenge-digitalocean](https://github.com/bmv437/le-challenge-digitalocean) |
| etcd           | [ceecko/le-challenge-etcd](https://github.com/ceecko/le-challenge-etcd) |
| - | Build Your Own <br> [le-challenge-dns-SPEC](https://git.coolaj86.com/coolaj86/le-challenge-dns.js) |
| Full List      | Search [le-challenge-](https://www.npmjs.com/search?q=le-challenge-) on npm |

Account & Certificate Storage
-----------

|                | Plugin    |
|:--------------:|:---------:|
| **Default (fs)** | [le-store-certbot](https://git.coolaj86.com/coolaj86/le-store-certbot.js) |
| AWS S3         | [paco3346/le-store-awss3](https://github.com/paco3346/le-store-awss3) |
| AWS S3         | [llun/le-store-s3](https://github.com/llun/le-store-s3) |
| Consul         | [sebastian-software/le-store-consul](https://github.com/sebastian-software/le-store-consul) |
| json (fs)      | [paulgrove/le-store-simple-fs](https://github.com/paulgrove/le-store-simple-fs)
| Redis          | [digitalbazaar/le-store-redis](https://github.com/digitalbazaar/le-store-redis) |
| - | Build Your Own <br> [le-store-SPEC](https://git.coolaj86.com/coolaj86/le-store-SPEC.js) |
| Full List      | Search [le-store-](https://www.npmjs.com/search?q=le-store-) on npm |

Auto-SNI
--------

|             | Plugin    |
|:-----------:|:---------:|
| **Default** | [le-store-certbot](https://git.coolaj86.com/coolaj86/le-sni-auto.js) |

(you probably wouldn't need or want to replace this)


**Bugs**: Please report bugs with the community plugins to the appropriate owner first, then here if you don't get a response.

Usage
=====
The oversimplified example was the bait
(because everyone seems to want an example that fits in 3 lines, even if it's terribly bad practices),
now here's the switch.

We have another completely working example that will provides a little more to build off of.

```
git clone https://git.coolaj86.com/coolaj86/greenlock-express.js.git
pushd greenlock-express.js
  npm install
popd

# replace 'fooCheckDb' in
# greenlock-express.js/examples/normal.js

node greenlock-express.js/examples/normal.js
```

It looks a little more like this:

`serve.js`:
```javascript
'use strict';

// returns an instance of greenlock.js with additional helper methods
var glx = require('greenlock-express').create({
  server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging:
  // https://acme-staging-v02.api.letsencrypt.org/directory
, version: 'draft-11' // Let's Encrypt v2 (ACME v2)

  // If you wish to replace the default account and domain key storage plugin
, store: require('le-store-certbot').create({
    configDir: require('path').join(require('os').homedir(), 'acme', 'etc')
  , webrootPath: '/tmp/acme-challenges'
  })

, approveDomains: approveDomains
});
```

The Automatic Certificate Issuance is initiated via SNI (`httpsOptions.SNICallback`).
For security, domain validation MUST have an approval callback in *production*.

```javascript
var http01 = require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' });
function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such

  // Opt-in to submit stats and get important updates
  opts.communityMember = true;

  // If you wish to replace the default challenge plugin, you may do so here
  opts.challenges = { 'http-01': http01 };

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
require('http').createServer(glx.middleware(require('redirect-https')())).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});



var app = require('express')();
app.use('/', function (req, res) {
  res.end('Hello, World!');
});

// handles your app
require('https').createServer(glx.httpsOptions, app).listen(443, function () {
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
* `glx.listen(plainPort, tlsPort)` Accepts port numbers (or arrays of port numbers) to listen on.

Brief overview of some simple options for `greenlock.js`:

* `opts.server` set to https://acme-v02.api.letsencrypt.org/directory in production
* `opts.version` set to `v01` for Let's Encrypt v1 or `draft-11` for Let's Encrypt v2 (mistakenly called ACME v2)
* `opts.email` The default email to use to accept agreements.
* `opts.agreeTos` When set to `true`, this always accepts the LetsEncrypt TOS. When a string it checks the agreement url first.
* `opts.communityMember` Join the community to get notified of important updates and help make greenlock better
* `opts.approveDomains` can be either of:
  * An explicit array of allowed domains such as `[ 'example.com', 'www.example.com' ]`
  * A callback `function (opts, certs, cb) { cb(null, { options: opts, certs: certs }); }` for setting `email`, `agreeTos`, `domains`, etc (as shown in usage example above)
* `opts.renewWithin` is the **maximum** number of days (in ms) before expiration to renew a certificate.
* `opts.renewBy` is the **minimum** number of days (in ms) before expiration to renew a certificate.

## Supported ACME versions

* Let's Encrypt v1 (aka v01)
* Let's Encrypt v2 (aka v02 or ACME draft 11)
* ACME draft 11 (ACME v2 is a misnomer)
* Wildcard domains (via dns-01 challenges)
  * `*.example.com`
