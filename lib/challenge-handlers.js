'use strict';

var fs = require('fs');
var path = require('path');

// TODO handle templating :hostname in letsencrypt proper

// Note: we're explicitly doing this on the filesystem
// rather than in-memory to support node cluster

module.exports = {
  set: function setChallenge(args, hostname, key, value, cb) {
    var keyfile = path.join((args.webrootPath || args.webrootTpl).replace(':hostname', hostname), key);

    fs.writeFile(keyfile, value, 'utf8', cb);
  }

, get: function getChallenge(args, hostname, key, cb) {
    var keyfile = path.join((args.webrootPath || args.webrootTpl).replace(':hostname', hostname), key);

    fs.readFile(keyfile, 'utf8', cb);
  }

, remove: function removeChallenge(args, hostname, key, cb) {
    var keyfile = path.join((args.webrootPath || args.webrootTpl).replace(':hostname', hostname), key);

    // Note: it's not actually terribly important that we wait for the unlink callback
    // but it's a polite thing to do - and we're polite people!
    fs.unlink(keyfile, cb);
  }
};
