letsencrypt-cluster
===================

Use automatic letsencrypt with node on multiple cores or even multiple machines.

* Take advantage of multi-core computing
* Process certificates in master
* Serve https from multiple workers
* Can work with any clustering strategy [#1](https://github.com/Daplie/letsencrypt-cluster/issues/1)

Install
=======

```bash
npm install --save letsencrypt-cluster@2.x
```

Usage
=====

In a cluster environment you have some main file that boots your app
and then conditionally loads certain code based on whether that fork
is the master or just a worker.

In such a file you might want to define some of the options that need
to be shared between both the master and the worker, like this:

`boot.js`:
```javascript
'use strict';

var cluster = require('cluster');
var path = require('path');
var os = require('os');

var main;
var sharedOptions = {
  webrootPath: path.join(os.tmpdir(), 'acme-challenge')			// /tmp/acme-challenge
                                                            // used by le-challenge-fs, the default plugin

, renewWithin: 10 * 24 * 60 * 60 * 1000 										// 10 days before expiration

, debug: true
};

if (cluster.isMaster) {
  main = require('./master');
}
else {
  main = require('./worker');
}

main.init(sharedOptions);
```

Master
------

We think it makes the most sense to load letsencrypt in master.
This can prevent race conditions (see [node-letsencrypt#45](https://github.com/Daplie/node-letsencrypt/issues/45))
as only one process is writing the to file system or database at a time.

The main implementation detail here is `approveDomains(options, certs, cb)` for new domain certificates
and potentially `agreeToTerms(opts, cb)` for new accounts.

The master takes **the same arguments** as `node-letsencrypt` (`challenge`, `store`, etc),
plus a few extra (`approveDomains`... okay, just one extra):

`master.js`:
```javascript
'use strict';

var cluster = require('cluster');

module.exports.init = function (sharedOpts) {
  var cores = require('os').cpus();
  var leMaster = require('letsencrypt-cluster/master').create({
    debug: sharedOpts.debug

  , server: 'staging'                                                       // CHANGE TO PRODUCTION

  , renewWithin: sharedOpts.renewWithin

  , webrootPath: sharedOpts.webrootPath

  , approveDomains: function (masterOptions, certs, cb) {
      // Do any work that must be done by master to approve this domain
      // (in this example, it's assumed to be done by the worker)

      var results = { domain: masterOptions.domain                          // required
                    , options: masterOptions                                // domains, email, agreeTos
                    , certs: certs };                                       // altnames, privkey, cert
      cb(null, results);
    }
  });

  cores.forEach(function () {
    var worker = cluster.fork();
    leMaster.addWorker(worker);
  });
};
```

### API

All options are passed directly to `node-letsencrypt`
(in other works, `leMaster` is a `letsencrypt` instance),
but a few are only actually used by `letsencrypt-cluster`.

* `leMaster.approveDomains(options, certs, cb)` is special for `letsencrypt-cluster`, but will probably be included in `node-letsencrypt` in the future (no API change).

* `leMaster.addWorker(worker)` is added by `letsencrypt-cluster` and **must be called** for each new worker.

Worker
------

The worker takes *similar* arguments to `node-letsencrypt`,
but only ones that are useful for determining certificate
renewal and for `le.challenge.get`.

If you want to  a non-default `le.challenge`

`worker.js`:
```javascript
'use strict';

module.exports.init = function (sharedOpts) {
  var leWorker = require('letsencrypt-cluster/worker').create({
    debug: sharedOpts.debug

  , renewWithin: sharedOpts.renewWithin

  , webrootPath: sharedOpts.webrootPath

  // , challenge: require('le-challenge-fs').create({ webrootPath: '...', ... })

  , approveDomains: function (workerOptions, certs, cb) {
      // opts = { domains, email, agreeTos, tosUrl }
      // certs = { subject, altnames, expiresAt, issuedAt }

      var results = {
        domain: workerOptions.domains[0]
      , options: {
          domains: workerOptions.domains
        }
      , certs: certs
      };

      if (certs) {
        // modify opts.domains to match the original request
        // email is not necessary, because the account already exists
        // this will only fail if the account has become corrupt
        results.options.domains = certs.altnames;
        cb(null, results);
        return;
      }

      // This is where one would check one's application-specific database:
      //   1. Lookup the domain to see which email it belongs to
      //   2. Assign a default email if it isn't in the system
      //   3. If the email has no le account, `agreeToTerms` will fire unless `agreeTos` is preset

      results.options.email = 'john.doe@example.com'
      results.options.agreeTos = true                                 // causes agreeToTerms to be skipped
      cb(null, results);
    }
  });

  function app(req, res) {
    res.end("Hello, World!");
  }

  var redirectHttps = require('redirect-https')();
  var plainServer = require('http').createServer(leWorker.middleware(redirectHttps));
  plainServer.listen(80);

  var server = require('https').createServer(leWorker.httpsOptions, leWorker.middleware(app));
  server.listen(443);
};
```

Message Passing
---------------

The master and workers will communicate through `process.on('message', fn)`, `process.send({})`,
`worker.on('message', fn)`and `worker.send({})`.

All messages have a `type` property which is a string and begins with `LE_`.
All other messages are ignored.
