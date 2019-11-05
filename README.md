# [Greenlock Express](https://git.rootprojects.org/root/greenlock-express.js) is Let's Encrypt for Node

![Greenlock Logo](https://git.rootprojects.org/root/greenlock.js/raw/branch/master/logo/greenlock-1063x250.png "Greenlock Logo")

| Built by [Root](https://therootcompany.com) for [Hub](https://rootprojects.org/hub/)

Free SSL, Automated HTTPS / HTTP2, served with Node via Express, Koa, hapi, etc.

### Let's Encrypt for Node and Express (and Koa, hapi, rill, etc)

Greenlock Express is a **Web Server** with **Fully Automated HTTPS** and renewals.

You define your app, and let Greenlock handle issuing and renewing Free SSL Certificates.

**Cloud-ready** with Node `cluster`.

# Serve your Sites with Free SSL

-   1. Create a Project with Greenlock Express
-   2. Initialize and Setup
-   3. Add Domains, and Hello, World!

### Create your project

```bash
npm init
```

```bash
npm install --save greenlock-express@v3
```

```bash
npx greenlock init --maintainer-email 'jon@example.com' --manager-config-file ./greenlock.json
```

<details>
<summary>server.js</summary>

```js
"use strict";

require("greenlock-express")
    .init(function() {
        return {
            greenlock: require("./greenlock.js"),

            // whether or not to run at cloudscale
            cluster: false
        };
    })
    .ready(function(glx) {
        var app = require("./app.js");

        // Serves on 80 and 443
        // Get's SSL certificates magically!
        glx.serveApp(app);
    });
```

</details>

<details>
<summary>greenlock.js</summary>

```js
"use strict";

var pkg = require("./package.json");
module.exports = require("@root/greenlock").create({
    // name & version for ACME client user agent
    packageAgent: pkg.name + "/" + pkg.version,

    // contact for security and critical bug notices
    maintainerEmail: pkg.author,

    // where to find .greenlockrc and set default paths
    packageRoot: __dirname
});
```

</details>

<details>
<summary>app.js</summary>

```js
var app = function(req, res) {
    res.end("Hello, Encrypted World!");
};

module.exports = app;
```

</details>

```bash
npx greenlock defaults --subscriber-email 'jon@example.com' --agree-to-terms
```

```bash
npx greenlock add --subject example.com --altnames example.com
```

```bash
npm start -- --staging
```

# Let's Encrypt for...

-   IoT
-   Enterprise On-Prem
-   Local Development
-   Home Servers
-   Quitting Heroku

# Features

-   [x] Let's Encrypt v2 (November 2019)
    -   [x] ACME Protocol (RFC 8555)
    -   [x] HTTP Validation (HTTP-01)
    -   [x] DNS Validation (DNS-01)
    -   [ ] ALPN Validation (TLS-ALPN-01)
        -   Need ALPN validation? [contact us](mailto:greenlock-support@therootcompany.com)
-   [x] Automated HTTPS
    -   [x] Fully Automatic Renewals every 45 days
    -   [x] Free SSL
    -   [x] **Wildcard** SSL
    -   [x] **Localhost** certificates
    -   [x] HTTPS-enabled Secure **WebSockets** (`wss://`)
-   [x] Fully customizable
    -   [x] **Reasonable defaults**
    -   [x] Domain Management
    -   [x] Key and Certificate Management
    -   [x] ACME Challenge Plugins

# QuickStart Guide

Easy as 1, 2, 3... 4

<details>
<summary>1. Create a node project</summary>

## 1. Create a node project

Create an empty node project.

Be sure to fill out the package name, version, and an author email.

```bash
mkdir ~/my-project
pushd ~/my-project
npm init
```

</details>

<details>
<summary>2. Create an http app (i.e. express)</summary>

## 2. Create an http app (i.e. express)

This example is shown with Express, but any node app will do. Greenlock
works with everything.
(or any node-style http app)

`my-express-app.js`:

```js
"use strict";

// A plain, node-style app

function myPlainNodeHttpApp(req, res) {
    res.end("Hello, Encrypted World!");
}

// Wrap that plain app in express,
// because that's what you're used to

var express = require("express");
var app = express();
app.get("/", myPlainNodeHttpApp);

// export the app normally
// do not .listen()

module.exports = app;
```

</details>

<details>
<summary>3. Serve with Greenlock Express</summary>

## 3. Serve with Greenlock Express

Greenlock Express is designed with these goals in mind:

-   Simplicity and ease-of-use
-   Performance and scalability
-   Configurability and control

You can start with **near-zero configuration** and
slowly add options for greater performance and customization
later, if you need them.

`server.js`:

```js
"use strict";

require("greenlock-express")
    .init(function() {
        var pkg = require("./package.json");
        return {
            greenlock: require("@root/greenlock").create({
                // name & version for ACME client user agent
                packageAgent: pkg.name + "/" + pkg.version,

                // contact for security and critical bug notices
                maintainerEmail: pkg.author,

                // where to find .greenlockrc and set default paths
                packageRoot: __dirname
            }),

            // whether or not to run at cloudscale
            cluster: false
        };
    })
    .ready(function(glx) {
        var app = require("./app.js");

        // Serves on 80 and 443
        // Get's SSL certificates magically!
        glx.serveApp(app);
    });
```

And start your server:

```bash
# Allow non-root node to use ports 80 (HTTP) and 443 (HTTPS)
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

```bash
# `npm start` will call `node ./server.js` by default
npm start
```

```bash
# use --staging to use the development API until you're ready to get real certificates
npm start -- --staging
```

```txt
Greenlock v3.0.0
Greenlock Manager Config File: ~/.config/greenlock/manager.json
Greenlock Storage Directory: ~/.config/greenlock/

Listening on 0.0.0.0:80 for ACME challenges and HTTPS redirects
Listening on 0.0.0.0:443 for secure traffic
```

</details>

<details>
<summary>4. Manage SSL Certificates and Domains</summary>

## 4. Manage domains

The management API is built to work with Databases, S3, etc.

By default, it's just a simple config file and directory.

```bash
# see which manager and what options are in use
cat .greenlockrc
```

<details>
<summary>Example Output</summary>

```json
{
    "manager": "greenlock-manager-fs",
    "configFile": "./greenlock.json"
}
```

</details>

```bash
# show the global defaults
npx greenlock defaults
```

```js
var defaults = await greenlock.defaults();
```

<details>
<summary>Example Output</summary>

```json
{
    "store": {
        "module": "greenlock-store-fs",
        "basePath": "./greenlock.d"
    },
    "challenges": {
        "http-01": {
            "module": "acme-http-01-standalone"
        }
    },
    "renewOffset": "-45d",
    "renewStagger": "3d",
    "accountKeyType": "EC-P256",
    "serverKeyType": "RSA-2048",
    "subscriberEmail": "jon@example.com",
    "agreeToTerms": true
}
```

</details>

```bash
# show per-site configs
npx greenlock config --subject example.com
```

```js
greenlock.sites.get({ subject: "example.com" });
```

<details>
<summary>Example Output</summary>

```json
{
    "subject": "example.com",
    "altnames": ["example.com"],
    "renewAt": 1576638107754,
    "defaults": {
        "store": {
            "module": "greenlock-store-fs",
            "basePath": "./greenlock.d"
        },
        "challenges": {
            "http-01": {
                "module": "acme-http-01-standalone"
            }
        }
    }
}
```

</details>

Management can be done via the **CLI** or the JavaScript [**API**](https://git.rootprojects.org/root/greenlock.js).
Since this is the QuickStart, we'll demo the **CLI**:

You need to create a Let's Encrypt _subscriber account_, which can be done globally, or per-site.
All individuals, and most businesses, should set this globally:

```bash
# Set a global subscriber account
npx greenlock defaults --subscriber-email 'mycompany@example.com' --agree-to-terms true
```

```js
greenlock.manager.defaults({
    subscriberEmail: "mycompany@example.com",
    agreeToTerms: true
});
```

<!-- todo print where the key was saved -->

A Let's Encrypt SSL certificate has a "Subject" (Primary Domain) and up to 100 "Alternative Names"
(of which the first _must_ be the subject).

```bash
# Add a certificate with specific domains
npx greenlock add --subject example.com --altnames example.com,www.example.com
```

```js
greenlock.sites.add({
    subject: "example.com",
    altnames: ["example.com"]
});
```

<!-- todo print where the cert was saved -->

Note: **Localhost**, **Wildcard**, and Certificates for Private Networks require
[**DNS validation**](https://git.rootprojects.org/root/greenlock-exp).

-   DNS Validation
    -   [**Wildcards**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/wildcards/) (coming soon)
    -   [**Localhost**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/localhost/) (coming soon)
    -   [**CI/CD**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/ci-cd/) (coming soon)

</details>

# Plenty of Examples

-   [greenlock-express.js/examples/](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples)
    -   [Express](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/express/)
    -   [Node's **http2**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/http2/)
    -   [Node's https](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/https/)
    -   [**WebSockets**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/websockets/)
    -   [Socket.IO](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/socket.io/)
    -   [Cluster](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/cluster/)
    -   [**Wildcards**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/wildcards/) (coming soon)
    -   [**Localhost**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/localhost/) (coming soon)
    -   [**CI/CD**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/ci-cd/) (coming soon)
    -   [HTTP Proxy](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/http-proxy/)

# Easy to Customize

<!-- greenlock-manager-test => greenlock-manager-custom -->

<!--
- [greenlock.js/examples/](https://git.rootprojects.org/root/greenlock.js/src/branch/master/examples)
-->

-   [Custom Domain Management](https://git.rootprojects.org/root/greenlock-manager-test.js)
    -   `npx greenlock init --manager ./path-or-npm-name.js --manager-FOO 'set option FOO'`
-   [Custom Key & Cert Storage](https://git.rootprojects.org/root/greenlock-store-test.js)
    -   `npx greenlock defaults --store greenlock-store-fs --store-base-path ./greenlock.d`
-   [Custom ACME HTTP-01 Challenges](https://git.rootprojects.org/root/acme-http-01-test.js)
    -   `npx greenlock defaults --challenge-http-01 ./you-http-01.js`
    -   `npx greenlock update --subject example.com --challenge-http-01 acme-http-01-standalone`
-   [Custom ACME DNS-01 Challenges](https://git.rootprojects.org/root/acme-dns-01-test.js)
    -   `npx greenlock defaults --challenge-dns-01 acme-dns-01-ovh --challenge-dns-01-token xxxx`
    -   `npx greenlock update --subject example.com --challenge-dns-01 ./your-dns-01.js

# Ready-made Integrations

Greenlock Express integrates between Let's Encrypt's ACME Challenges and many popular services.

| Type        | Service                                                                             | Plugin                   |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------ |
| dns-01      | CloudFlare                                                                          | acme-dns-01-cloudflare   |
| dns-01      | [Digital Ocean](https://git.rootprojects.org/root/acme-dns-01-digitalocean.js)      | acme-dns-01-digitalocean |
| dns-01      | [DNSimple](https://git.rootprojects.org/root/acme-dns-01-dnsimple.js)               | acme-dns-01-dnsimple     |
| dns-01      | [DuckDNS](https://git.rootprojects.org/root/acme-dns-01-duckdns.js)                 | acme-dns-01-duckdns      |
| http-01     | File System / [Web Root](https://git.rootprojects.org/root/acme-http-01-webroot.js) | acme-http-01-webroot     |
| dns-01      | [GoDaddy](https://git.rootprojects.org/root/acme-dns-01-godaddy.js)                 | acme-dns-01-godaddy      |
| dns-01      | [Gandi](https://git.rootprojects.org/root/acme-dns-01-gandi.js)                     | acme-dns-01-gandi        |
| dns-01      | [NameCheap](https://git.rootprojects.org/root/acme-dns-01-namecheap.js)             | acme-dns-01-namecheap    |
| dns-01      | [Name&#46;com](https://git.rootprojects.org/root/acme-dns-01-namedotcom.js)         | acme-dns-01-namedotcom   |
| dns-01      | Route53 (AWS)                                                                       | acme-dns-01-route53      |
| http-01     | S3 (AWS, Digital Ocean, Scaleway)                                                   | acme-http-01-s3          |
| dns-01      | [Vultr](https://git.rootprojects.org/root/acme-dns-01-vultr.js)                     | acme-dns-01-vultr        |
| dns-01      | [Build your own](https://git.rootprojects.org/root/acme-dns-01-test.js)             | acme-dns-01-test         |
| http-01     | [Build your own](https://git.rootprojects.org/root/acme-http-01-test.js)            | acme-http-01-test        |
| tls-alpn-01 | [Contact us](mailto:support@therootcompany.com)                                     | -                        |

Example Usage:

```bash
npx greenlock defaults --challenge-dns-01 acme-dns-01-ovh --challenge-dns-01-token xxxx
npx greenlock defaults --challenge-http-01 acme-http-01-s3 --challenge-http-01-bucket my-bucket
```

Search `acme-http-01-` or `acme-dns-01-` on npm to find more.

# Full Documentation

<!--
- Greenlock CLI
- Greenlock JavaScript API
-->

Most of the documentation is done by use-case examples, as shown up at the top of the README.

We're working on more comprehensive documentation for this newly released version.
**Please open an issue** with questions in the meantime.

# Commercial Support

Do you need...

-   training?
-   specific features?
-   different integrations?
-   bugfixes, on _your_ timeline?
-   custom code, built by experts?
-   commercial support and licensing?

You're welcome to [contact us](mailto:aj@therootcompany.com) in regards to IoT, On-Prem,
Enterprise, and Internal installations, integrations, and deployments.

We have both commercial support and commercial licensing available.

We also offer consulting for all-things-ACME and Let's Encrypt.

# Legal &amp; Rules of the Road

Greenlock&trade; is a [trademark](https://rootprojects.org/legal/#trademark) of AJ ONeal

The rule of thumb is "attribute, but don't confuse". For example:

> Built with [Greenlock Express](https://git.rootprojects.org/root/greenlock.js) (a [Root](https://rootprojects.org) project).

Please [contact us](mailto:aj@therootcompany.com) if you have any questions in regards to our trademark,
attribution, and/or visible source policies. We want to build great software and a great community.

[Greenlock&trade;](https://git.rootprojects.org/root/greenlock.js) |
MPL-2.0 |
[Terms of Use](https://therootcompany.com/legal/#terms) |
[Privacy Policy](https://therootcompany.com/legal/#privacy)
[Privacy Policy](https://therootcompany.com/legal/#privacy)
