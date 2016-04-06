'use strict';

var path = require('path');
var challengeStore = require('./challenge-handlers');
var createSniCallback = require('./sni-callback').create;
var LE = require('letsencrypt');

function createAcmeResponder(lex, onRequest) {

  function httpAcmeResponder(req, res) {
    if (lex.debug) {
      console.debug('[LEX] ', req.method, req.headers.host, req.url);
    }
    var acmeChallengePrefix = '/.well-known/acme-challenge/';

    if (0 !== req.url.indexOf(acmeChallengePrefix)) {
      onRequest(req, res);
      return;
    }

    var key = req.url.slice(acmeChallengePrefix.length);

    // lex = { debug, webrootPath }
    lex.getChallenge(lex, req.headers.host, key, function (err, val) {
      if (lex.debug) {
        console.debug('[LEX] GET challenge, response:');
        console.debug('challenge:', key);
        console.debug('response:', val);
        if (err) {
          console.debug(err.stack);
        }
      }
      res.end(val || '_');
    });
  }

  return httpAcmeResponder;
}

function lexHelper(obj, app) {
  var defaultPems = require('localhost.daplie.com-certificates');

  if (!obj) {
    obj = {};
  }

  if ('string' === typeof obj) {
    obj = {
      configDir: obj
    };
  }

  if ('function' === typeof obj) {
    obj = {
      onRequest: obj
    };
  }

  obj.debug = LEX.debug;

  if ('function' === typeof app) {
    obj.onRequest = obj.onRequest || app;
  }

  if (!obj.getChallenge) {
    if (false !== obj.getChallenge) {
      obj.getChallenge = LEX.getChallenge;
    }
    if (!obj.webrootPath) {
      obj.webrootPath = path.join(require('os').tmpdir(), 'acme-challenge');
    }
  }

  // BEGIN LetsEncrypt options
  if (!obj.configDir) {
    obj.configDir = path.join(require('homedir')(), '/letsencrypt/etc');
  }
  if (!obj.privkeyPath) {
    obj.privkeyPath = ':config/live/:hostname/privkey.pem';
  }
  if (!obj.fullchainPath) {
    obj.fullchainPath = ':config/live/:hostname/fullchain.pem';
  }
  if (!obj.certPath) {
    obj.certPath = ':config/live/:hostname/cert.pem';
  }
  if (!obj.chainPath) {
    obj.chainPath = ':config/live/:hostname/chain.pem';
  }
  if (!obj.server) {
    obj.server = LEX.defaultServerUrl;
  }
  // END LetsEncrypt options

  obj.getChallenge = obj.getChallenge || LEX.getChallenge;
  obj.setChallenge = obj.setChallenge || LEX.setChallenge;
  obj.removeChallenge = obj.removeChallenge || LEX.removeChallenge;

  if (!obj.letsencrypt) {
    //LE.merge(obj, );
    // { configDir, webrootPath, server }
    obj.letsencrypt = LE.create(obj, {
      setChallenge: obj.setChallenge
    , removeChallenge: obj.removeChallenge
    });
  }

  var httpsOptions = obj.httpsOptions || {};
  var sniCallback = httpsOptions.SNICallback;

  // https://nodejs.org/api/https.html
  // pfx, key, cert, passphrase, ca, ciphers, rejectUnauthorized, secureProtocol
  if (!httpsOptions.pfx) {
    if (!(httpsOptions.cert || httpsOptions.key)) {
      httpsOptions.key = defaultPems.key;
      httpsOptions.cert = defaultPems.cert;
    }
    else if (!(httpsOptions.cert && httpsOptions.key)) {
      if (!httpsOptions.cert) {
        console.warn("You specified httpsOptions.cert, but not httpsOptions.key");
      }
      if (!httpsOptions.key) {
        console.warn("You specified httpsOptions.key, but not httpsOptions.cert");
      }
    }
  }

  if (!obj.approveRegistration && LEX.defaultApproveRegistration) {
    obj.approveRegistration = function (domain, cb) {
      if (obj.debug) {
        console.debug('[LEX] auto register against staging server');
      }
      cb(null, {
        email: 'example@gmail.com'
      , domains: [domain]
      , agreeTos: true
      , server: LEX.stagingServerUrl
      });
    };
  }

  if (obj.sniCallback) {
    if (sniCallback) {
      console.warn("You specified both args.sniCallback and args.httpsOptions.SNICallback,"
      + " but only args.sniCallback will be used.");
    }
    httpsOptions.SNICallback = obj.sniCallback;
  }
  else if (sniCallback) {
    obj._sniCallback = createSniCallback(obj);
    httpsOptions.SNICallback = function (domain, cb) {
      sniCallback(domain, function (err, context) {
        if (context) {
          cb(err, context);
          return;
        }

        obj._sniCallback(domain, cb);
      });
    };
  }
  else {
    httpsOptions.SNICallback = createSniCallback(obj);
  }

  obj.httpsOptions = httpsOptions;

  return obj;
}

function LEX(obj, app) {
  var https;
  try {
    https = require('spdy');
  } catch(e) {
    https = require('https');
  }
  var http = require('http');

  function listen(plainPorts, tlsPorts, onListening) {
    if (!(obj.onRequest || (obj.onHttpRequest && obj.onHttpsRequest)) && false !== obj.onRequest) {
      console.warn("You should either do args.onRequest = app or server.on('request', app),"
        + " otherwise only acme-challenge requests will be handled (and the rest will hang)");
      console.warn("You can silence this warning by setting args.onRequest = false");
    }
    obj.httpAcmeResponder = createAcmeResponder(obj, obj.onHttpRequest || obj.onRequest);
    obj.httpsAcmeResponder = createAcmeResponder(obj, obj.onHttpsRequest || obj.onRequest);

    if (plainPorts && (!Array.isArray(plainPorts) || !Array.isArray(tlsPorts))) {
      throw new Error(".listen() must be used with plain and tls port arrays, like this: `.listen([80], [443, 5001], function () {})`");
    }

    var results = {
      plainServers: []
    , tlsServers: []
    };

    plainPorts = plainPorts || [80];
    tlsPorts = tlsPorts || [443, 5001];

    function defaultOnListening() {
      /*jshint validthis: true*/
      var server = this;
      var protocol = ('honorCipherOrder' in server || 'rejectUnauthorized' in server) ? 'https': 'http';
      var addr = server.address();
      var port;

      if (80 === addr.port || 443 === addr.port) {
        port = '';
      } else {
        port = ':' + addr.port;
      }
      console.info('Listening ' + protocol + '://' + addr.address + port + '/');
    }

    plainPorts.forEach(function (addr) {
      var port = addr.port || addr;
      var address = addr.address || '';
      var server = http.createServer(obj.httpAcmeResponder);

      server.__le_onListening = addr.onListen;
      server.__le_port = port;
      server.__le_address = address;

      results.plainServers.push(server);
    });

    tlsPorts.forEach(function (addr) {
      var port = addr.port || addr;
      var address = addr.address || '';
      var options = addr.httpsOptions || obj.httpsOptions;
      var server = https.createServer(options, obj.httpsAcmeResponder);

      server.__le_onListen = addr.onListen;
      server.__le_port = port;
      server.__le_address = address;

      results.tlsServers.push(server);
    });

    results.plainServers.forEach(function (server) {
      var listen = server.__le_onListening || onListening || defaultOnListening;
      server.listen(server.__le_port, server.__le_address, listen);
    });

    results.tlsServers.forEach(function (server) {
      var listen = server.__le_onListening || onListening || defaultOnListening;
      server.listen(server.__le_port, server.__le_address, listen);
    });

    // deleting creates a "slow object", but that's okay (we only use it once)
    return results;
  }

  obj = lexHelper(obj, app);
  obj.listen = listen;

  return obj;
}

module.exports = LEX;

LEX.create = LEX;
LEX.createServers = LEX;
LEX.setChallenge = challengeStore.set;
LEX.getChallenge = challengeStore.get;
LEX.removeChallenge = challengeStore.remove;
LEX.createSniCallback = createSniCallback;
// TODO not sure how well this works
LEX.middleware = function (defaults) {
  var leCore = require('letiny-core');
  var merge = require('letsencrypt/common').merge;
  var tplConfigDir = require('letsencrypt/common').tplConfigDir;
  var tplHostname = require('letsencrypt/common').tplHostname;
  var prefix = leCore.acmeChallengePrefix;

  tplConfigDir(defaults.configDir || '', defaults);

  return function (req, res, next) {
    if (LEX.debug) {
      console.debug('[LEX middleware]:', req.hostname, req.url, req.url.slice(prefix.length));
    }

    if (0 !== req.url.indexOf(prefix)) {
      next();
      return;
    }

    function done(err, token) {
      if (err) {
        res.send("Error: These aren't the tokens you're looking for. Move along.");
        return;
      }

      res.send(token);
    }

    var copy = merge(defaults, { domains: [req.hostname] });
    tplHostname(req.hostname, copy);

    LEX.getChallenge(copy, req.hostname, req.url.slice(prefix.length), done);
  };
};

LEX.stagingServerUrl = LE.stagingServerUrl;
LEX.productionServerUrl = LE.productionServerUrl || LE.liveServerUrl;
LEX.defaultServerUrl = LEX.productionServerUrl;
LEX.createAcmeResponder = createAcmeResponder;
LEX.normalizeOptions = lexHelper;
LEX.testing = function () {
  LEX.debug = true;
  LEX.defaultServerUrl = LEX.stagingServerUrl;
  LEX.defaultApproveRegistration = true;
  console.debug = console.log;
  console.debug('[LEX] testing mode turned on');
  console.debug('[LEX] default server: ' + LEX.defaultServerUrl);
  console.debug('\n');
  console.debug('###################################################');
  console.debug('#                                                 #');
  console.debug('#     Open up a browser and visit this server     #');
  console.debug('#     at its domain name.                         #');
  console.debug('#                                                 #');
  console.debug('#                                 ENJOY!          #');
  console.debug('#                                                 #');
  console.debug('###################################################');
  console.debug('\n');
  console.debug('Note: testing certs will be installed because .testing() was called.');
  console.debug('      remove .testing() to get live certs.');
  console.debug('\n');
  console.debug('[LEX] automatic registration handling turned on for testing.');
  console.debug('\n');

  return module.exports;
};
