'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

// TODO handle templating :hostname in letsencrypt proper

// Note: we're explicitly doing this on the filesystem
// rather than in-memory to support node cluster

module.exports = {
  set: function setChallenge(args, hostname, key, value, cb) {
    var webrootPath = args.webrootPath;
    var keyfile = path.join(webrootPath, key);

    if (args.debug) {
      console.debug('[LEX] write file', hostname, webrootPath);
      console.debug('challenge:', key);
      console.debug('response:', value);
    }
    fs.writeFile(keyfile, value, 'utf8', function (err) {
      if (!err) { cb(null); return; }


      if (args.debug) {
        console.debug('[LEX] mkdirp', webrootPath);
      }
      mkdirp(webrootPath, function (err) {
        if (err) { cb(err); return; }

        fs.writeFile(keyfile, value, 'utf8', cb);
      });
    });
  }

, get: function getChallenge(args, hostname, key, cb) {
    var keyfile = path.join(args.webrootPath, key);

    if (args.debug) {
      console.debug('[LEX] getChallenge', keyfile, hostname, key);
    }
    fs.readFile(keyfile, 'utf8', function (err, text) {
      cb(null, text);
    });
  }

, remove: function removeChallenge(args, hostname, key, cb) {
    var keyfile = path.join(args.webrootPath, key);

    // Note: it's not actually terribly important that we wait for the unlink callback
    // but it's a polite thing to do - and we're polite people!
    if (args.debug) {
      console.debug('[LEX] removeChallenge', keyfile, hostname, key);
    }
    fs.unlink(keyfile, function (err) {
      if (err) { console.warn(err.stack); }
      cb(null);
    });
  }
};
