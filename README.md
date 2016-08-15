[![Join the chat at https://gitter.im/Daplie/letsencrypt-express](https://badges.gitter.im/Daplie/letsencrypt-express.svg)](https://gitter.im/Daplie/letsencrypt-express?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

| [letsencrypt (library)](https://github.com/Daplie/node-letsencrypt)
| [letsencrypt-cli](https://github.com/Daplie/letsencrypt-cli)
| **letsencrypt-express**
| [letsencrypt-koa](https://github.com/Daplie/letsencrypt-koa)
| [letsencrypt-hapi](https://github.com/Daplie/letsencrypt-hapi)
|

letsencrypt-express
===================

Free SSL and managed or automatic HTTPS for node.js with Express, Koa, Connect, Hapi, and all other middleware systems.

* Automatic Registration via SNI (`httpsOptions.SNICallback`)
  * **registrations** require an **approval callback** in *production*
* Automatic Renewal (around 80 days)
  * **renewals** are *fully automatic* and happen in the *background*, with **no downtime**
* Automatic vhost / virtual hosting

All you have to do is start the webserver and then visit it at it's domain name.

Help Wanted
-----------

There are a number of easy-to-complete features that are up for grabs.

(mostly requiring either tracing some functions and doing some console.log-ing
or simply updating docs and getting tests to pass so that certain plugins accept
and return the right type of objects to complete the implementation
of certain plugins).

If you've got some free cycles to help, I can guide you through the process,
I'm just still too busy to do it all myself right now and nothing is breaking.

Email me <aj@daplie.com> if you want to help.

Install
=======

```bash
npm install --save letsencrypt-express@2.x
```

QuickStart
==========

Here's a completely working (but terribly oversimplified) example that will get you started:

`app.js`:
```javascript
'use strict';

require('letsencrypt-express').create({

  server: 'staging'

, email: 'john.doe@example.com'

, agreeTos: true

, app: require('express')().use('/', function (req, res) {
    res.end('Hello, World!');
  })

}).listen(80, 443);
```

Certificates will be stored in `~/letsencrypt`.

**Important**:

You must set `server` to `https://acme-v01.api.letsencrypt.org/directory` **after**
you have tested that your setup works.

**Security Warning**:

If you don't do proper checks in `approveDomains(opts, certs, cb)`
an attacker will spoof SNI packets with bad hostnames and that will
cause you to be rate-limited and or blocked from the ACME server.

Why You Must Use 'staging' First
--------------------------------

There are a number of common problems related to system configuration -
firewalls, ports, permissions, etc - that you are likely to run up against
when using letsencrypt for your first time.

In order to avoid being blocked by hitting rate limits with bad requests,
you should always test against the `'staging'` server
(`https://acme-staging.api.letsencrypt.org/directory`) first.

Usage
=====

The oversimplified example was the bait
(because everyone seems to want an example that fits in 3 lines, even if it's terribly bad practices),
now here's the switch:

`serve.js`:
```javascript
'use strict';

// returns an instance of node-letsencrypt with additional helper methods
var lex = require('letsencrypt-express').create({
  // set to https://acme-v01.api.letsencrypt.org/directory in production
  server: 'staging'

// If you wish to replace the default plugins, you may do so here
//
//, challenges: { 'http-01:' require('le-challenge-fs').create({}) }
//, store: require('le-store-certbot').create({})
//, sni: require('le-sni-auto').create({})

, approveDomains: function (opts, certs, cb) {
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

    cb(null, opts);
  }
});



// handles acme-challenge and redirects to https
require('http').createServer(lex.middleware()).listen(80, function () {
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

API
===

All options are passed directly to `node-letsencrypt`,
so `lex` is an instance of `letsencrypt`, but has a few
extra helper methods and options.

See [node-letsencrypt options](https://github.com/Daplie/node-letsencrypt)

* `lexOptions.approveDomains(options, certs, cb)` is special for `letsencrypt-express`, but will probably be included in `node-letsencrypt` in the future (no API change).

* `lexOptions.app` is just an elaborate ruse used for the Quickstart. It's sole purpose is to trim out 5 lines of code for setting http and https servers so that whiners won't whine. Real programmers don't use this.
* `leOptions.email` useful for simple sites where there is only one owner. Leave this `null` and use `approveDomains` otherwise.
* `leOptions.agreeTos` useful for simple sites where there is only one owner. Leave this `null` and use `approveDomains` otherwise.
* `leOptions.renewWithin` is shared so that the worker knows how earlier to request a new cert
* `leOptions.renewBy` is passed to `le-sni-auto` so that it staggers renewals between `renewWithin` (latest) and `renewBy` (earlier)
* `lex.middleware(nextApp)` uses `letsencrypt/middleware` for GET-ing `http-01`, hence `sharedOptions.webrootPath`
* `lex.httpsOptions` has a default localhost certificate and the `SNICallback`.

There are a few options that aren't shown in these examples, so if you need to change something
that isn't shown here, look at the code (it's not that much) or open an issue.
