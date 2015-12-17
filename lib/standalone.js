'use strict';

var path = require('path');
var challengeStore = require('./lib/challange-handlers');

function create(obj, app) {
  var LE = require('letsencrypt');
  var https = require('https');
  var http = require('http');

  var httpsOptions = obj.httpsOptions || {};
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
      obj.getChallenge = getChallenge;
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

  if (!obj.letsencrypt) {
    //LE.merge(obj, );
    obj.letsencrypt = LE.create(obj, {
      setChallenge: setChallenge
    , removeChallenge: removeChallenge
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

module.exports = create;
module.exports.create = create;
module.exports.setChallenge = challengeStore.set;
module.exports.getChallenge = challengeStore.get;
module.exports.removeChallenge = challengeStore.remove;
