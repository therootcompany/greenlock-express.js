'use strict';

var cluster = require('cluster');
var main;



// You'll often see examples where people use cluster
// master and worker all in the same file, which is fine,
// but in order to conserve memory and especially to be
// less confusing, I'm splitting the code into two files
if (cluster.isMaster) {
  main = require('./master');
}
else {
  main = require('./worker');
}



// this is nothing letsencrypt-cluster specific
// I'm just arbitrarily choosing to share some configuration
// that I know I'm going to use in both places
main.init({

  // Depending on the strategy, the whole le-challenge-<<strategy>>
  // could be shared between worker and server, but since I'm just
  // using using le-challenge-fs (as you'll see), I'm only sharing the webrootPath
  webrootPath: require('os').tmpdir() + require('path').sep + 'acme-challenge'

  // this is used both by node-letsencrypt (master) and le-sni-auto (worker)
, renewWithin: 15 * 24 * 60 * 60 * 1000
});
