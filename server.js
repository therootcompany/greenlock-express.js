#!/usr/bin/env node
'use strict';
/*global Promise*/

/////////////////////////////////
// an okay vhost + api example //
/////////////////////////////////

//
// I run this on a few servers. It demonstrates dynamic virtual hosting + apis
// /srv/www -> static sites in plain folders
// ex: /srv/www/example.com
//
// /srv/api -> express apps
// ex: /srv/api/api.example.com
//

var configpath = process.argv[2] || './config.js';
var config = require(configpath);
// The prefix where sites go by name.
// For example: whatever.com may live in /srv/www/whatever.com, thus /srv/www is our path

var path = require('path');
var fs = require('fs').promises;
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

//var glx = require('greenlock-express')
var glx = require('./').create({

  version: 'draft-11'                                       // Let's Encrypt v2 is ACME draft 11

//, server: 'https://acme-staging-v02.api.letsencrypt.org/directory'
, server: 'https://acme-v02.api.letsencrypt.org/directory'  // If at first you don't succeed, stop and switch to staging
                                                            // https://acme-staging-v02.api.letsencrypt.org/directory

, configDir: config.configDir                               // You MUST have access to write to directory where certs
                                                            // are saved. ex: /home/foouser/.config/acme

, approveDomains: myApproveDomains                          // Greenlock's wraps around tls.SNICallback. Check the
                                                            // domain name here and reject invalid ones

, app: myVhostApp                                           // Any node-style http app (i.e. express, koa, hapi, rill)

  /* CHANGE TO A VALID EMAIL */
, email: config.email                                       // Email for Let's Encrypt account and Greenlock Security
, agreeTos: true                                            // Accept Let's Encrypt ToS
//, communityMember: true                                   // Join Greenlock to get important updates, no spam

//, debug: true
, store: require('le-store-fs')

});

var server = glx.listen(80, 443);
server.on('listening', function () {
  console.info(server.type + " listening on", server.address());
});

function myApproveDomains(opts) {
  console.log(opts.domain);
  // In this example the filesystem is our "database".
  // We check in /srv/www for whatever.com and if it exists, it's allowed
  // SECURITY Greenlock validates opts.domains ahead-of-time so you don't have to

  var domains = [];
  var domain = opts.domain.replace(/^(www|api)\./, '');
  return checkWwws(domain).then(function (hostname) {
    // tried both permutations already (failed first, succeeded second)
    if (hostname !== domain) {
      domains.push(hostname);
      return;
    }

    // only tried the bare domain, let's try www too
    domains.push(domain);
    return checkWwws('www.' + domain).then(function (hostname) {
      if (hostname === domain) {
        domains.push(domain);
      }
    });
  }).catch(function () {
    // ignore error
    return null;
  }).then(function () {
    // check for api prefix
    var apiname = domain;
    if (domains.length) {
      apiname = 'api.' + domain;
    }
    return checkApi(apiname).then(function () {
      domains.push(apiname);
    }).catch(function () {
      return null;
    });
  }).then(function () {
    if (0 === domains.length) {
      return Promise.reject(new Error("no bare, www., or api. domain matching '" + opts.domain + "'"));
    }

    //opts.email = email;
    opts.agreeTos = true;
    // pick the shortest (bare) or latest (www. instead of api.) to be the subject
    opts.subject = opts.domains.sort(function (a, b) {
      var len = a.length - b.length;
      if (0 !== len) { return len; }
      if (a < b) { return 1; } else { return -1; }
    })[0];

    if (!opts.challenges) { opts.challenges = {}; }
    opts.challenges['http-01'] = require('le-challenge-fs');
    //opts.challenges['dns-01'] = require('le-challenge-dns');

    // explicitly set account id and certificate.id
    opts.account = { id: opts.email };
    opts.certificate = { id: opts.subject };

    return Promise.resolve(opts);
  });
}

function checkApi(hostname) {
  var apipath = path.join(config.api, hostname);
  var link = '';
  return fs.stat(apipath).then(function (stats) {
    if (stats.isDirectory()) {
      return require(apipath);
    }
    return fs.readFile(apipath, 'utf8').then(function (txt) {
      var linkpath = txt.split('\n')[0];
      link = (' => ' + linkpath + ' ');
      return require(linkpath);
    });
  }).catch(function (e) {
    if ('ENOENT' === e.code) { return null; }
    console.error(e);
    throw new Error("rejecting '" + hostname + "' because '" + apipath + link + "' failed at require()");
  });
}

function checkWwws(_hostname) {
  if (!_hostname) {
    // SECURITY don't serve the whole config.srv
    return Promise.reject(new Error("missing hostname"));
  }
  var hostname = _hostname;
  var hostdir = path.join(config.srv, hostname);
  // TODO could test for www/no-www both in directory
  return fs.readdir(hostdir).then(function () {
    // TODO check for some sort of htaccess.json and use email in that
    // NOTE: you can also change other options such as `challengeType` and `challenge`
    // opts.challengeType = 'http-01';
    // opts.challenge = require('le-challenge-fs').create({});
    return hostname;
  }).catch(function () {
    if ('www.' === hostname.slice(0, 4)) {
      // Assume we'll redirect to non-www if it's available.
      hostname = hostname.slice(4);
      hostdir = path.join(config.srv, hostname);
      return fs.readdir(hostdir).then(function () {
        return hostname;
      });
    } else {
      // Or check and see if perhaps we should redirect non-www to www
      hostname = 'www.' + hostname;
      hostdir = path.join(config.srv, hostname);
      return fs.readdir(hostdir).then(function () {
        return hostname;
      });
    }
  }).catch(function () {
    throw new Error("rejecting '" + _hostname + "' because '" + hostdir + "' could not be read");
  });
}

function myVhostApp(req, res) {
  // SECURITY greenlock pre-sanitizes hostnames to prevent unauthorized fs access so you don't have to
  // (also: only domains approved above will get here)
  console.info(req.method, (req.headers.host|'') + req.url);
  Object.keys(req.headers).forEach(function (key) {
    console.info(key, req.headers[key])
  });

  // We could cache wether or not a host exists for some amount of time
  var fin = finalhandler(req, res);
  return checkWwws(req.headers.host).then(function (hostname) {
    if (hostname !== req.headers.host) {
      res.statusCode = 302;
      res.setHeader('Location', 'https://' + hostname);
      // SECURITY this is safe only because greenlock disallows invalid hostnames
      res.end("<!-- redirecting to https://" + hostname + "-->");
      return;
    }
    var serve = serveStatic(path.join(config.srv, hostname), { redirect: true });
    serve(req, res, fin);
  }).catch(function (err) {
    return checkApi(req.headers.host).then(function (app) {
      if (app) { app(req, res); return; }
      console.error("none found", err);
      fin();
    }).catch(function (err) {
      console.error("api crashed error", err);
      fin(err);
    });
  });
}
