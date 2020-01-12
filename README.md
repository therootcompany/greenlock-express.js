# [Greenlock Express v4](https://git.rootprojects.org/root/greenlock-express.js) is Let's Encrypt for Node

| Built by [Root](https://therootcompany.com) for [Hub](https://rootprojects.org/hub/) |

![Greenlock Logo](https://git.rootprojects.org/root/greenlock.js/raw/branch/master/logo/greenlock-1063x250.png "Greenlock Logo")

### Free SSL for Node Web Servers

Greenlock Express is a **Web Server** with **Fully Automated HTTPS** and renewals.

You define your app and let Greenlock handle issuing and renewing Free SSL Certificates.

```bash
npm init
npm install --save greenlock-express@v4
```

`server.js`:

```js
"use strict";

var app = require("./app.js");

require("greenlock-express")
    .init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",

        // contact for security and critical bug notices
        maintainerEmail: "jon@example.com",

        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
```

`./greenlock.d/config.json`:

```json
{ "sites": [{ "subject": "example.com", "altnames": ["example.com"] }] }
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
    -   [x] **Cloud-ready** with Node `cluster`.
-   [x] Fully customizable
    -   [x] **Reasonable defaults**
    -   [x] Domain Management
    -   [x] Key and Certificate Management
    -   [x] ACME Challenge Plugins

# Compatibility

Works with _any_ node http app, including

-   [x] Express
-   [x] Koa
-   [x] hapi
-   [x] rill
-   [x] http2
-   [x] cluster
-   [x] etc...

# v4 QuickStart

Serving sites with Free SSL is as easy as 1, 2, 3... 4

### Overview

1. Create a Project with Greenlock Express
    - `server.js`
    - `app.js`
2. Setup the config file (or database)
    - `greenlock.d/config.json`
3. Add Domains
    - `npx greenlock add --subject example.com --altnames example.com`
4. Hello, World!
    - `npm start -- --staging`

## 1. Create your Project

```bash
# Install the latest node, if needed
curl -fsL bit.ly/node-installer | bash

# Create your project, add Greenlock Express v4
npm init
npm install --save greenlock-express@v4
```

You can use **local file storage** or a **database**. The default is to use file storage.

## 2. Initialize and Config (Dir or DB)

```bash
# Note: you can use the CLI to create `server.js` and `greenlock.d/config.json`
npx greenlock init --config-dir ./greenlock.d --maintainer-email 'jon@example.com'
```

`server.js`:

```js
"use strict";

var app = require("./app.js");

require("greenlock-express")
    .init({
        packageRoot: __dirname,

        // contact for security and critical bug notices
        configDir: "./greenlock.d",

        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
```

`app.js`:

```js
"use strict";

// Here's a vanilla HTTP app to start,
// but feel free to replace it with Express, Koa, etc
var app = function(req, res) {
    res.end("Hello, Encrypted World!");
};

module.exports = app;
```

### 3. Add Sites

```bash
# Note: you can use the CLI to edit the config file
npx greenlock add --subject example.com --altnames example.com
```

`greenlock.d/config.json`:

<!-- TODO update manager to write array rather than object -->

```json
{ "sites": [{ "subject": "example.com", "altnames": ["example.com"] }] }
```

### 4. Hello, Encrypted World!

```bash
# Note: you can use npm start to run server.js with the --staging flag set
npm start -- --staging
```

```txt
> my-project@1.0.0 start /srv/www/my-project
> node server.js

Listening on 0.0.0.0:80 for ACME challenges and HTTPS redirects
Listening on 0.0.0.0:443 for secure traffic
```

## Walkthrough

For a more detail read the full
[WALKTHROUGH](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/WALKTHROUGH.md).

# Examples

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

# Troubleshooting

### What if the example didn't work?

Double check the following:

-   **Public Facing IP** for `http-01` challenges
    -   Are you running this _as_ a public-facing webserver (good)? or localhost (bad)?
    -   Does `ifconfig` show a public address (good)? or a private one - 10.x, 192.168.x, etc (bad)?
    -   If you're on a non-public server, are you using the `dns-01` challenge?
-   **valid email**
    -   You MUST set `maintainerEmail` to a **valid address**
    -   MX records must validate (`dig MX example.com` for `'john@example.com'`)
-   **valid DNS records**
    -   Must have public DNS records (test with `dig +trace A example.com; dig +trace www.example.com` for `[ 'example.com', 'www.example.com' ]`)
-   **write access**
    -   You MUST set `configDir` to a writeable location (test with `touch ./greenlock.d/config.json`)
-   **port binding privileges**
    -   You MUST be able to bind to ports 80 and 443
    -   You can do this via `sudo` or [`setcap`](https://gist.github.com/firstdoit/6389682)
-   **API limits**
    -   You MUST NOT exceed the API [**usage limits**](https://letsencrypt.org/docs/staging-environment/) per domain, certificate, IP address, etc
-   **Red Lock, Untrusted**
    -   You MUST switch from `npm start -- --staging` to `npm start` to use the **production** server
    -   The API URL should not have 'acme-staging-v02', but should have 'acme-v02'

# Using a Database, S3, etc

If you have a small site, the default file storage will work well for you.

If you have many sites with many users, you'll probably want to store config in a database of some sort.

See the section on **Custom** callbacks and plugins below.

# Advanced Configuration

All of the advanced configuration is done by replacing the default behavior with callbacks.

You can whip up your own, or you can use something that's published to npm.

See the section on **Custom** callbacks and plugins below.

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
    -   `npx greenlock update --subject example.com --challenge-dns-01 ./your-dns-01.js`

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
