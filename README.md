# [Greenlock Express](https://git.rootprojects.org/root/greenlock-express.js) is Let's Encrypt for Node

![Greenlock Logo](https://git.rootprojects.org/root/greenlock.js/raw/branch/master/logo/greenlock-1063x250.png "Greenlock Logo")

| Built by [Root](https://therootcompany.com) for [Hub](https://rootprojects.org/hub/)

Free SSL, Automated HTTPS / HTTP2, served with Node via Express, Koa, hapi, etc.

```js
require("greenlock-express")
	.init(getConfig)
	.serve(worker);

function getConfig() {
	return {
		package: require("./package.json")
	};
}

function worker(server) {
	server.serveApp(function(req, res) {
		// Works with any Node app (Express, etc)
		res.end("Hello, Encrypted World!");
	});
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

# Plenty of Examples

- [greenlock-express.js/examples/](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples)
  - [Express](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/express.js)
  - [Node's **http2**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/http2.js)
  - [Node's https](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/https.js)
  - [**WebSockets**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/websockets.js)
  - [Socket.IO](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/socket-io.js)
  - [Cluster](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/socket-io.js)
  - [**Wildcards**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/wildcards/README.md)
  - [**Localhost**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/localhost/README.md)
  - [**CI/CD**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/ci-cd/README.md)

# Easy to Customize

<!-- greenlock-manager-test => greenlock-manager-custom -->

- [greenlock.js/examples/](https://git.rootprojects.org/root/greenlock.js/src/branch/master/examples)
  - [Custom Domain Management](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/custom-manager/README.md)
  - [Custom Key & Cert Storage](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/custom-store/README.md)
  - [Custom ACME Challenges](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/custom-acme-challenges/README.md)

# QuickStart Guide

Easy as 1, 2, 3... 4

## 1. Create a node project

Create an empty node project.

Be sure to fill out the package name, version, and an author email.

```bash
mkdir ~/my-project
pushd ~/my-project
npm init
```

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

## 3. Serve with Greenlock Express

Greenlock Express is designed with these goals in mind:

- Simplicity and ease-of-use
- Performance and scalability
- Configurability and control

You can start with **near-zero configuration** and
slowly add options for greater performance and customization
later, if you need them.

`server.js`:

```bash
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
  var app = require('my-express-app.js');
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

## 4. Manage domains

Management can be done via the **CLI** or the JavaScript [**API**](https://git.rootprojects.org/root/greenlock.js/).
Since this is the QuickStart, we'll demo the **CLI**:

You need to create a Let's Encrypt _subscriber account_, which can be done globally, or per-site.
All individuals, and most businesses, should set this globally:

```bash
# Set a global subscriber account
npx greenlock config --subscriber-email 'mycompany@example.com' --agree-to-terms true
```

<!-- todo print where the key was saved -->

A Let's Encrypt SSL certificate has a "Subject" (Primary Domain) and up to 100 "Alternative Names"
(of which the first _must_ be the subject).

```bash
# Add a certificate with specific domains
npx greenlock add --subject example.com --altnames example.com,www.example.com
```

<!-- todo print where the cert was saved -->

This will update the config file (assuming the default fs-based management plugin):

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

Note: **Localhost**, **Wildcard**, and Certificates for Private Networks require
[**DNS validation**](https://git.rootprojects.org/root/greenlock-exp).

- DNS Validation
  - [**Wildcards**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/wildcards/README.md)
  - [**Localhost**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/localhost/README.md)
  - [**CI/CD**](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/examples/ci-cd/README.md)

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
