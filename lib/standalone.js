'use strict';

var path = require('path');
var challengeStore = require('./lib/challange-handlers');
var createSniCallback = require('./lib/sni-callback').create;
var LE = require('letsencrypt');

function LEX(obj, app) {
  var https = require('https');
  var http = require('http');
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

  if ('function' === typeof app) {
    obj.onRequest = obj.onRequest || app;
  }

  if (!obj.getChallenge) {
    if (false !== obj.getChallenge) {
      obj.getChallenge = challengeStore.get;
    }
    if (!obj.webrootPath) {
      obj.webrootPath = path.join(require('os').tmpdir(), 'acme-challenge');
    }
  }

  if (!obj.onRequest && false !== obj.onRequest) {
    console.warn("You should either do args.onRequest = app or server.on('request', app),"
      + " otherwise only acme-challenge requests will be handled (and the rest will hang)");
    console.warn("You can silence this warning by setting args.onRequest = false");
  }

  if (!obj.configDir) {
    obj.configDir = require('os').homedir() + '/letsencrypt/etc';
  }

  if (!obj.server) {
    obj.server = LEX.defaultServerUrl;
  }

  if (!obj.letsencrypt) {
    //LE.merge(obj, );
    // { configDir, webrootPath, server }
    obj.letsencrypt = LE.create(obj, {
      setChallenge: challengeStore.set
    , removeChallenge: challengeStore.remove
    });
  }

  function acmeResponder(req, res) {
    var acmeChallengePrefix = '/.well-known/acme-challenge/';

    if (0 !== req.url.indexOf(acmeChallengePrefix)) {
      obj.onRequest(req, res);
      return;
    }

    var key = req.url.slice(acmeChallengePrefix.length);

    obj.getChallenge(obj, req.headers.host, key, function (err, val) {
      res.end(val || '_');
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

  function listen(plainPorts, tlsPorts, onListening) {
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

    console.log(plainPorts);
    plainPorts.forEach(function (addr) {
      var port = addr.port || addr;
      var address = addr.address || '';
      var server = http.createServer(acmeResponder);

      server.__le_onListening = addr.onListen;
      server.__le_port = port;
      server.__le_address = address;

      results.plainServers.push(server);
    });

    tlsPorts.forEach(function (addr) {
      var port = addr.port || addr;
      var address = addr.address || '';
      var options = addr.httpsOptions || httpsOptions;
      var server = https.createServer(options, acmeResponder);

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

  return {
    listen: listen
  };
}

module.exports = LEX;

LEX.create = LEX;
LEX.setChallenge = challengeStore.set;
LEX.getChallenge = challengeStore.get;
LEX.removeChallenge = challengeStore.remove;
LEX.createSniCallback = createSniCallback;

LEX.stagingServerUrl = LE.stagingServerUrl;
LEX.productionServerUrl = LE.productionServerUrl || LE.liveServerUrl;
LEX.defaultServerUrl = LEX.productionServerUrl;
LEX.testing = function () {
  LEX.defaultServerUrl = LEX.stagingServerUrl;
  return module.expotrs;
};
