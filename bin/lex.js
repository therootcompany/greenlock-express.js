#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('fs');
var cli = require('cli');
var mkdirp = require('mkdirp');
var homedir = require('os').homedir();
var configDir = path.join(homedir, 'letsencrypt');
var desktop = path.join(homedir, 'Desktop');
var vhostDir = path.join(fs.existsSync(desktop) ? desktop : configDir, 'www');
var welcomeHtml = fs.readFileSync(path.join(__dirname, '..', 'lib', 'public', 'welcome.html'), 'utf8');
var express = require('express');

cli.parse({
  'agree-tos': [ false, " Agree to the Let's Encrypt Subscriber Agreement", 'boolean', false ]
, email: [ false, " Email used for registration and recovery contact. (default: null)", 'email' ]
, domains: [ false, " Domain names to apply. To include the www domain with your main domain your can enter both with a comma. Ex --domains example.com,www.example.com (default: [])", 'string' ]
, debug: [ false, " show traces and logs", 'boolean', false ]
, server: [ false, " ACME Directory Resource URI.", 'string', 'https://acme-v01.api.letsencrypt.org/directory)' ]
});

// ignore certonly and extraneous arguments
cli.main(function(_, options) {
  console.log('');
  var args = {};

  Object.keys(options).forEach(function (key) {
    var val = options[key];

    if ('string' === typeof val) {
      val = val.replace(/^~/, homedir);
    }

    key = key.replace(/\-([a-z0-9A-Z])/g, function (c) { return c[1].toUpperCase(); });
    args[key] = val;
  });

  if (args.domains) {
    args.domains = args.domains.split(',');
  }

  makeDirectories();

  function makeDirectories() {
    mkdirp(configDir, function (err) {
      if (err) {
        console.error("Could not create config directory '" + configDir + "':", err.code);
        console.error(err.stack);
        return;
      }

      mkdirp(vhostDir, function (err) {
        if (err) {
          console.error("Could not create vhost directory '" + vhostDir + "':", err.code);
          console.error(err.stack);
          return;
        }

        startServers();
      });
    });
  }

  function configure(le, args, cb) {
    var vhost;
    var pubDir;
    var index;

    if (!(args.email && args.agreeTos && args.server && args.domains)) {
      cb({ error : { message: "missing one or more of agreeTos,domains,email,server" } });
      return;
    }

    vhost = args.domains[0];
    pubDir = path.join(vhostDir, vhost);
    index = path.join(pubDir, 'index.html');

    makeLandingPage();

    function makeLandingPage() {
      mkdirp(pubDir, function (err) {
        if (err) {
          cb(err);
          return;
        }

        fs.exists(index, function (exists) {
          if (exists) {
            configureForHttps();
            return;
          }

          fs.writeFile(path.join(pubDir, 'index.html'), welcomeHtml.replace(/:hostname/g, vhost), 'utf8', function (err) {
            if (err) {
              cb(err);
              return;
            }

            configureForHttps();
          });
        });
      });
    }

    function configureForHttps() {
      if (args.debug) {
        console.log('[LEX] configureForHttps');
        console.log(args);
      }
      le.setConfig(args, cb);
    }
  }

  function createConfigurator(le) {
    var app = express();

    app.use('/', express.static(path.join(__dirname, '..', 'lib', 'configurator')));

    app.use(require('body-parser').json());

    app.get('/api/com.daplie.lex/sites', function (req, res, next) {
      le.getConfigs({ configDir: configDir }, function (err, configs) {
        if (err) {
          next(err);
          return;
        }
        res.send(configs);
      });
    });

    app.post('/api/com.daplie.lex/sites', function (req, res, next) {
      var data = req.body;

      configure(le, data, function (err, configs) {
        if (err) {
          console.error("[LEX/bin] configure");
          console.error(err.stack);
          next(err);
          return;
        }

        res.send(configs);
      });
    });

    return app;
  }

  function startServers() {
    // Note: using staging server url, remove .testing() for production
    var LE = require('letsencrypt');
    var LEX = require('../');
    var le = LE.create({
      configDir: configDir
    , manual: true

    , privkeyPath: LE.privkeyPath
    , fullchainPath: LE.fullchainPath
    , certPath: LE.certPath
    , chainPath: LE.chainPath
    , renewalPath: LE.renewalPath
    , accountsDir: LE.accountsDir
    }, {
      setChallenge: LEX.setChallenge
    , removeChallenge: LEX.removeChallenge
    });
    var app = express();
    var vhosts = {};

    vhosts['localhost.daplie.com'] = createConfigurator(le, vhosts);

    app.use('/', function (req, res, next) {
      var hostname = (req.hostname||req.headers.host||'').replace(/^www\./, '');
      var pubDir = path.join(vhostDir, hostname);

      if (vhosts[hostname]) {
        vhosts[hostname](req, res, next);
        return;
      }

      fs.exists(pubDir, function (exists) {
        if (exists) {
          vhosts[hostname] = express().use('/', express.static(pubDir));
          vhosts[hostname](req, res, next);
        } else {
          vhosts['localhost.daplie.com'](req, res, next);
        }
      });
    });
    app.use('/', express.static(path.join(__dirname, '..', 'lib', 'public')));

    LEX.create({
      onRequest: app
    , configDir: configDir
    , letsencrypt: le
    , approveRegistration: function (domain, cb) {
        le.getConfig({ domains: [domain] }, function (err, config) {
          if (!(config && config.checkpoints >= 0)) {
            cb(null, null);
            return;
          }

          cb(null, {
            email: config.email
                // can't remember which it is, but the pyconf is different that the regular variable
          , agreeTos: config.tos || config.agree || config.agreeTos
          , server: config.server || LE.productionServerUrl
          , domains: config.domains || [domain]
          });
        });
      }
    }).listen([80], [443, 5001]);
  }

  /*
      // should get back account, path to certs, pems, etc?
      console.log('\nCertificates installed at:');
      console.log(Object.keys(results).filter(function (key) {
        return /Path/.test(key);
      }).map(function (key) {
        return results[key];
      }).join('\n'));
  */
});
