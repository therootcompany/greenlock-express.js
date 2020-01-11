# Greenlock Express Walkthrough

This will show you the basics of how to

1. Create a node project
2. Create an http app (i.e. express)
3. Serve with Greenlock Express
4. Manage SSL Certificates and Domains

## 1. Create a node project

Create an empty node project.

Be sure to fill out the package name, version, and an author email.

```bash
mkdir ~/my-project
pushd ~/my-project
npm init
```

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

//var pkg = require("./package.json");
var app = require("./app.js");

require("greenlock-express")
    .init({
        // where to find .greenlockrc and set default paths
        packageRoot: __dirname,

        // where config and certificate stuff go
        configDir: "./greenlock.d",

        // contact for security and critical bug notices
        maintainerEmail: pkg.author,

        // name & version for ACME client user agent
        //packageAgent: pkg.name + "/" + pkg.version,

        // whether or not to run at cloudscale
        cluster: false
    })
    .serve(app);
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
Greenlock v4.0.0
Greenlock Config Dir/File: ./greenlock.d/config.json

Listening on 0.0.0.0:80 for ACME challenges and HTTPS redirects
Listening on 0.0.0.0:443 for secure traffic
```

## 4. Manage SSL Certificates and Domains

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
    "manager": {
        "module": "@greenlock/manager"
    },
    "configDir": "./greenlock.d"
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
