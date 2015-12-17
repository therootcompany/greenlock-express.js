'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

// TODO handle templating :hostname in letsencrypt proper

// Note: we're explicitly doing this on the filesystem
// rather than in-memory to support node cluster

module.exports = {
  set: function setChallenge(args, hostname, key, value, cb) {
    var webrootPath = (args.webrootPath || args.webrootTpl).replace(':hostname', hostname);
    var keyfile = path.join(webrootPath, key);

    if (args.debug) {
      console.log('[LEX] write file', hostname, webrootPath, key);
    }
    fs.writeFile(keyfile, value, 'utf8', function (err) {
      if (!err) { cb(null); return; }


      if (args.debug) {
        console.log('[LEX] mkdirp', webrootPath);
      }
      mkdirp(webrootPath, function () {
        if (err) { cb(err); return; }

        fs.writeFile(keyfile, value, 'utf8', cb);
      });
    });
  }

, get: function getChallenge(args, hostname, key, cb) {
    var keyfile = path.join((args.webrootPath || args.webrootTpl).replace(':hostname', hostname), key);

    if (args.debug) {
      console.log('[LEX] getChallenge', hostname, key);
    }
    fs.readFile(keyfile, 'utf8', function (err, text) {
      cb(null, text);
    });
  }

, remove: function removeChallenge(args, hostname, key, cb) {
    var keyfile = path.join((args.webrootPath || args.webrootTpl).replace(':hostname', hostname), key);

    // Note: it's not actually terribly important that we wait for the unlink callback
    // but it's a polite thing to do - and we're polite people!
    if (args.debug) {
      console.log('[LEX] removeChallenge', hostname, key);
    }
    fs.unlink(keyfile, function (err) {
      if (err) { console.warn(err.stack); }
      cb(null);
    });
  }
};
