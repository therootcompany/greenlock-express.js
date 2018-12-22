![Greenlock Logo](https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/greenlock-1063x250.png "Greenlock Logo")

!["Greenlock Function"](https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/from-not-secure-to-secure-url-bar.png "from url bar showing not secure to url bar showing secure")

<table>
  <tr>
    <td><a href="https://medium.com/@bohou/secure-your-nodejs-server-with-letsencrypt-for-free-f8925742faa9" target="_blank"><img src="https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/ibm-301x112.png"></a></td>
    <td><a href="https://github.com/mozilla-iot/le-store-certbot/issues/4" target="_blank"><img src="https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/mozilla-iot-301x112.png"></a></td>
    <td><a href="https://github.com/digitalbazaar/bedrock-letsencrypt" target="_blank"><img src="https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/digital-bazaar-301x112.png"></a></td>
  </tr>
</table>
<table>
  <tr>
    <td><a href="https://github.com/beakerbrowser/homebase" target="_blank"><img src="https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/beaker-browser-301x112.png"></a></td>
    <td><a href="https://telebit.cloud" target="_blank"><img src="https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/telebit-301x112.png"></a></td>
    <td><a href="https://ppl.family" target="_blank"><img src="https://git.coolaj86.com/coolaj86/greenlock.js/raw/branch/master/logo/ppl-301x112.png"></a></td>
  </tr>
</table>

# [Greenlock](https://git.coolaj86.com/coolaj86/greenlock-express.js)&trade; for Express.js

<small>formerly letsencrypt-express</small>

Free SSL, Free Wildcard SSL, and Fully Automated HTTPS made dead simple<br>
<small>certificates issued by Let's Encrypt v2 via [ACME](https://git.coolaj86.com/coolaj86/acme-v2.js)</small>

!["Lifetime Downloads"](https://img.shields.io/npm/dt/greenlock.svg "Lifetime Download Count can't be shown")
!["Monthly Downloads"](https://img.shields.io/npm/dm/greenlock.svg "Monthly Download Count can't be shown")
!["Weekly Downloads"](https://img.shields.io/npm/dw/greenlock.svg "Weekly Download Count can't be shown")
!["Stackoverflow Questions"](https://img.shields.io/stackexchange/stackoverflow/t/greenlock.svg "S.O. Question count can't be shown")
<a href="https://twitter.com/intent/follow?screen_name=GreenlockHTTPS"><img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow%20@GreenlockHTTPS" title="Follow @GreenlockHTTPS on Twitter" alt="Twitter Badge"></a>

| A [Root](https://therootcompany.com) Project |
[Greenlock&trade;](https://git.coolaj86.com/coolaj86/greenlock.js) is for
[Web Servers](https://git.coolaj86.com/coolaj86/greenlock-cli.js),
[Web Browsers](https://greenlock.domains),
and **node.js middleware systems**.

# Features

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

# Install

```bash
npm install --save greenlock-express@2.x
```

# QuickStart

<!-- TODO better quickstart (fewer options) -->

### Screencast

Watch the QuickStart demonstration: [https://youtu.be/e8vaR4CEZ5s](https://youtu.be/e8vaR4CEZ5s&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk)

<a href="https://www.youtube.com/watch?v=e8vaR4CEZ5s&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk"><img src="https://i.imgur.com/Y8ix6Ts.png" title="QuickStart Video" alt="YouTube Video Preview" /></a>

* [0:00](https://www.youtube.com/watch?v=e8vaR4CEZ5s&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk#t=0) - Intro
* [2:22](https://www.youtube.com/watch?v=e8vaR4CEZ5s&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk#t=142) - Demonstrating QuickStart Example
* [6:37](https://www.youtube.com/watch?v=e8vaR4CEZ5s&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk?t=397) - Troubleshooting / Gotchas

#### Beyond the QuickStart (Part 2)

* [1:00](https://www.youtube.com/watch?v=bTEn93gxY50&index=2&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk&t=60) - Bringing Greenlock into an Existing Express Project
* [2:26](https://www.youtube.com/watch?v=bTEn93gxY50&index=2&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk&t=146) - The `approveDomains` callback

#### Security Concerns (Part 3)

* [0:00](https://www.youtube.com/watch?v=aZgVqPzoZTY&index=3&list=PLZaEVINf2Bq_lrS-OOzTUJB4q3HxarlXk) - Potential Attacks, and Mitigation

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
  email: 'john.doe@example.com'     // The email address of the ACME user / hosting provider
, agreeTos: true                    // You must accept the ToS as the host which handles the certs
, configDir: '~/.config/acme/'      // Writable directory where certs will be saved
, communityMember: true             // Join the community to get notified of important updates
, telemetry: true                   // Contribute telemetry data to the project

  // Using your express app:
  // simply export it as-is, then include it here
, app: require('./app.js')

//, debug: true
}).listen(80, 443);
```

`app.js`:
```js
'use strict';

var express = require('express');
var app = express();

app.use('/', function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end('Hello, World!\n\n💚 🔒.js');
})

// Don't do this:
// app.listen(3000)

// Do this instead:
module.exports = app;
```

### `communityMember`

If you're the kind of person that likes the kinds of stuff that I do,
well, I want to do more of it and I'd like to get you involved.

As expected, by default we keep your email private and only use it for
transactional messaging, urgent security or API updates
(such as the mandatory upgrade to Let's Encrypt v2), and ACME account registration.

However, when you set the `communityMember` option to `true` we'll also
inform you when there are meaningful and relavant feature updates (no bugfix noise),
and give you early access to similar projects.

You can see our full privacy policy at <https://greenlock.domains/legal/#privacy>.

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

## Working Examples

| Example         | Location + Description |
|:---------------:|:---------:|
| **QuickStart**  | [examples/quickstart.js](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/quickstart.js) uses the fewest options and accepts all default settings. It's guaranteed to work for you. |
| Production      | [examples/production.js](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/production.js) shows how to require an express app (or other middleware system), expand the `approveDomains` callback, provides an example database shim, and exposes the server instance. |
| Virtual&nbsp;Hosting | [examples/vhost.js](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/vhost.js) shows how to dynamically secure and serve domains based on their existance on the file system. |
| HTTP2&nbsp;(spdy)    | Presently spdy is incompatible with node v11, but [examples/spdy.js](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/spdy.js) demonstrates how to manually configure a node web server with spdy-compatible versions of node and Greenlock. |
| HTTP2&nbsp;(node)    | [examples/http2.js](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/http2.js) uses node's new HTTP2 module, which is NOT compatible with the existing middleware systems (and is not "stable" as of v10.0). |
| WebSockets&nbsp;(ws) | [examples/websockets.js](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/websockets.js) demonstrates how to use Greenlock express with a websocket server. |
| - | Build Your Own <br> Be sure to tell me (@coolaj86) / us (@GreenlockHTTPS) about it. :) |
| Full&nbsp;List      | Check out the [examples/](https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples) directory |

# Plugins

**IMPORTANT**: Community plugins may or may not be maintained and working. Please try with the defaults before switching to community plugins.

## HTTP-01 Challenges

|                | Plugin    |
|:--------------:|:---------:|
| **Default (fs)** | [le-challenge-fs](https://git.coolaj86.com/coolaj86/le-challenge-fs.js) |
| AWS S3         | [llun/le-challenge-s3](https://github.com/llun/le-challenge-s3) |
| Azure          | [kolarcz/node-le-challenge-azure-storage](https://github.com/kolarcz/node-le-challenge-azure-storage) |
| - | Build Your Own <br> [le-challenge-http-SPEC](https://git.coolaj86.com/coolaj86/le-challenge-manual.js) |
| Full List      | Search [le-challenge-](https://www.npmjs.com/search?q=le-challenge-) on npm |


## DNS-01 Challenges

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

## Account & Certificate Storage

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

## Auto-SNI

|             | Plugin    |
|:-----------:|:---------:|
| **Default** | [le-sni-auto](https://git.coolaj86.com/coolaj86/le-sni-auto.js) |

(you probably wouldn't need or want to replace this)


**Bugs**: Please report bugs with the community plugins to the appropriate owner first, then here if you don't get a response.

# Usage

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

  // Contribute telemetry data to the project
, telemetry: true

  // the default servername to use when the client doesn't specify
  // (because some IoT devices don't support servername indication)
, servername: 'example.com'

, approveDomains: approveDomains
});

var server = glx.listen(80, 443, function () {
  console.log("Listening on port 80 for ACME challenges and 443 for express app.");
});
```

Note: You shouldn't be using the plain HTTP server for anything except, potentially, for error handling
on the listen event (if the default print-and-quit behavior doesn't work for your use case).
If you need to do that, here's how:

```
var plainServer = server.unencrypted;
plainServer.on('error', function (err) { ... });
```

The Automatic Certificate Issuance is initiated via SNI (`httpsOptions.SNICallback`).
For security, domain validation MUST have an approval callback in *production*.

```javascript
var http01 = require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' });
function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such
  // if (!isAllowed(opts.domains)) { return cb(new Error("not allowed")); }

  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames (if that's useful)

  // Opt-in to submit stats and get important updates
  opts.communityMember = true;

  // If you wish to replace the default challenge plugin, you may do so here
  opts.challenges = { 'http-01': http01 };

  opts.email = 'john.doe@example.com';
  opts.agreeTos = true;

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

**Security**:

Greenlock will do a self-check on all domain registrations
to prevent you from hitting rate limits.


# API

This module is an elaborate ruse (to provide an oversimplified example and to nab some SEO).

The API is actually located at [greenlock.js options](https://git.coolaj86.com/coolaj86/greenlock.js)
(because all options are simply passed through to `greenlock.js` proper without modification).

The only "API" consists of two options, the rest is just a wrapper around `greenlock.js` to take LOC from 15 to 5:

* `opts.app` An express app in the format `function (req, res) { ... }` (no `next`).
* `server = glx.listen(plainAddr, tlsAddr, onListen)` Accepts port numbers (or arrays of port numbers) to listen on, returns secure server.
  * `listen(80, 443)`
  * `listen(80, 443, onListenSecure)`
  * `listen(80, 443, onListenPlain, onListenSecure)`
  * `listen('localhost:80', '0.0.0.0:443')`
  * `listen('[::1]:80', '[::]:443')`
  * `listen('/tmp/glx.plain.sock', '/tmp/glx.secure.sock')`

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

<small>tags: letsencrypt acme free ssl automated https node express.js</small>

# Legal

Greenlock&trade; is a [trademark](https://greenlock.domains/legal/#trademark) of AJ ONeal

[greenlock-express.js](https://git.coolaj86.com/coolaj86/greenlock-express.js) |
MPL-2.0 |
[Terms of Use](https://therootcompany.com/legal/#terms) |
[Privacy Policy](https://therootcompany.com/legal/#privacy)
