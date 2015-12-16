# letsencrypt-express
Free SSL and Automatic HTTPS for node.js with Express, Connect, and other middleware systems

## Coming Soon

We're working on it

## In the meantime

See [examples/express-minimal.js](https://github.com/Daplie/node-letsencrypt/blob/master/examples/express-minimal.js)

## Options

If any of these values are `undefined` or `null` the will assume use reasonable defaults.

Partially defined values will be merged with the defaults.

Setting the value to `false` will, in many cases (as documented), disable the defaults.

```
webrootPath: string             // string     a path to a folder where temporary challenge files will be stored and read
                                // default    os.tmpdir() + path.sep + 'acme-challenge'


getChallenge: func | false      // false      do not handle getChallenge
                                //
                                // func       Example:
                                //
                                // default    function (defaults, hostname, key, cb) {
                                //              var filename = path.join(defaults.webrootPath.replace(':hostname', hostname), key);
                                //              fs.readFile(filename, 'ascii', function (cb, text) {
                                //                cb(null, text);
                                //              })
                                //            }


httpsOptions: object            // object     will be merged with internal defaults and passed to https.createServer()
                                //            { pfx, key, cert, passphrase, ca, ciphers, rejectUnauthorized, secureProtocol }
                                //            See https://nodejs.org/api/https.html
                                //            Note: if SNICallback is specified, it will be run *before*
                                //            the internal SNICallback that manages automated certificates
                                //
                                // default    uses a localhost cert and key to prevent https.createServer() from throwing an error
                                //            and also uses our SNICallback, which manages certificates


sniCallback: func               // func       replace the default sniCallback handler (which manages certificates) with your own
```
