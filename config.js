"use strict";

var path = require("path");
module.exports = {
    email: "jon.doe@example.com",
    configDir: path.join(__dirname, "acme"),
    srv: "/srv/www/",
    api: "/srv/api/",
    proxy: {
        "example.com": "http://localhost:4080",
        "*.example.com": "http://localhost:4080"
    },

    // DNS-01 challenges only
    challenges: {
        "*.example.com": require("acme-dns-01-YOUR_DNS_HOST").create({
            token: "xxxx"
        })
    }
};
