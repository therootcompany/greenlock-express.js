# New Documentation &amp; [v2/v3 Migration Guide](https://git.rootprojects.org/root/greenlock.js/src/branch/v3/MIGRATION_GUIDE_V2_V3.md)

Greenlock v3 just came out of private beta **today** (Nov 1st, 2019).

The code is complete and we're working on great documentation.

Many **examples** and **full API** documentation are still coming.

# [Greenlock Express](https://git.rootprojects.org/root/greenlock-express.js) is Let's Encrypt for Node

![Greenlock Logo](https://git.rootprojects.org/root/greenlock.js/raw/branch/master/logo/greenlock-1063x250.png "Greenlock Logo")

| Built by [Root](https://therootcompany.com) for [Hub](https://rootprojects.org/hub/)

Free SSL, Automated HTTPS / HTTP2, served with Node via Express, Koa, hapi, etc.

### Let's Encrypt for Node, Express, etc

Greenlock Express is a **Web Server** with **Fully Automated HTTPS** and renewals.

```js
"use strict";

function httpsWorker(glx) {
	// Serves on 80 and 443
	// Get's SSL certificates magically!

	glx.serveApp(function(req, res) {
		res.end("Hello, Encrypted World!");
	});
}

var pkg = require("./package.json");
require("greenlock-express")
	.init(function getConfig() {
		// Greenlock Config

		return {
			package: { name: pkg.name, version: pkg.version },
			maintainerEmail: pkg.author,
			cluster: false
		};
	})
	.serve(httpsWorker);
```

Manage via API or the config file:

`~/.config/greenlock/manage.json`: (default filesystem config)

```json
{
	"subscriberEmail": "letsencrypt-test@therootcompany.com",
	"agreeToTerms": true,
	"sites": {
		"example.com": {
			"subject": "example.com",
			"altnames": ["example.com", "www.example.com"]
		}
	}
}
```

# Let's Encrypt for...

- IoT
- Enterprise On-Prem
- Local Development
- Home Servers
- Quitting Heroku

# Features

- [x] Let's Encrypt v2 (November 2019)
  - [x] ACME Protocol (RFC 8555)
  - [x] HTTP Validation (HTTP-01)
  - [x] DNS Validation (DNS-01)
  - [ ] ALPN Validation (TLS-ALPN-01)
    - Need ALPN validation? [contact us](mailto:greenlock-support@therootcompany.com)
- [x] Automated HTTPS
  - [x] Fully Automatic Renewals every 45 days
  - [x] Free SSL
  - [x] **Wildcard** SSL
  - [x] **Localhost** certificates
  - [x] HTTPS-enabled Secure **WebSockets** (`wss://`)
- [x] Fully customizable
  - [x] **Reasonable defaults**
  - [x] Domain Management
  - [x] Key and Certificate Management
  - [x] ACME Challenge Plugins

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

This example is shown with Express, but any node app will doGreenlock
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

- Simplicity and ease-of-use
- Performance and scalability
- Configurability and control

You can start with **near-zero configuration** and
slowly add options for greater performance and customization
later, if you need them.

`server.js`:

```js
require("greenlock-express")
	.init(getConfig)
	.serve(worker);

function getConfig() {
	return {
		// uses name and version as part of the ACME client user-agent
		// uses author as the contact for support notices
		package: require("./package.json")
	};
}

function worker(server) {
	// Works with any Node app (Express, etc)
	var app = require("my-express-app.js");
	server.serveApp(app);
}
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

HOWEVER, by default it starts with a simple config file.

<!--
This will update the config file (assuming the default fs-based management plugin):
-->

`~/.config/greenlock/manager.json`:

```json
{
	"subscriberEmail": "letsencrypt-test@therootcompany.com",
	"agreeToTerms": true,
	"sites": {
		"example.com": {
			"subject": "example.com",
			"altnames": ["example.com", "www.example.com"]
		}
	}
}
```

COMING SOON

Management can be done via the **CLI** or the JavaScript [**API**](https://git.rootprojects.org/root/greenlock.js/).
Since this is the QuickStart, we'll demo the **CLI**:

You need to create a Let's Encrypt _subscriber account_, which can be done globally, or per-site.
All individuals, and most businesses, should set this globally:

```bash
# COMING SOON
# (this command should be here by Nov 5th)
# (edit the config by hand for now)
#
# Set a global subscriber account
npx greenlock config --subscriber-email 'mycompany@example.com' --agree-to-terms true
```

<!-- todo print where the key was saved -->

A Let's Encrypt SSL certificate has a "Subject" (Primary Domain) and up to 100 "Alternative Names"
(of which the first _must_ be the subject).

```bash
# COMING SOON
# (this command should be here by Nov 5th)
# (edit the config by hand for now)
#
# Add a certificate with specific domains
npx greenlock add --subject example.com --altnames example.com,www.example.com
```

<!-- todo print where the cert was saved -->

Note: **Localhost**, **Wildcard**, and Certificates for Private Networks require
[**DNS validation**](https://git.rootprojects.org/root/greenlock-exp).

- DNS Validation
  - [**Wildcards**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/wildcards/) (coming soon)
  - [**Localhost**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/localhost/) (coming soon)
  - [**CI/CD**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/ci-cd/) (coming soon)

</details>

# Plenty of Examples

**These are in-progress** Check back tomorrow (Nov 2nd, 2019).

- [greenlock-express.js/examples/](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples)
  - [Express](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/express/)
  - [Node's **http2**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/http2/)
  - [Node's https](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/https/)
  - [**WebSockets**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/websockets/)
  - [Socket.IO](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/socket-io/)
  - [Cluster](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/cluster/)
  - [**Wildcards**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/wildcards/) (coming soon)
  - [**Localhost**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/localhost/) (coming soon)
  - [**CI/CD**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/ci-cd/) (coming soon)
  - [HTTP Proxy](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/http-proxy/)

# Easy to Customize

<!-- greenlock-manager-test => greenlock-manager-custom -->

<!--
- [greenlock.js/examples/](https://git.rootprojects.org/root/greenlock.js/src/branch/master/examples)
-->

- [Custom Domain Management](https://git.rootprojects.org/root/greenlock-manager-test.js)
- [Custom Key & Cert Storage](https://git.rootprojects.org/root/greenlock-store-test.js)
- [Custom ACME HTTP-01 Challenges](https://git.rootprojects.org/root/acme-http-01-test.js)
- [Custom ACME DNS-01 Challenges](https://git.rootprojects.org/root/acme-dns-01-test.js)

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

- training?
- specific features?
- different integrations?
- bugfixes, on _your_ timeline?
- custom code, built by experts?
- commercial support and licensing?

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
