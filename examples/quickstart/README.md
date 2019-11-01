# Quick Start for Let's Encrypt with Node.js

```js
npm install --save greenlock-express
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
