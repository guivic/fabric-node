# fabric-node
[![dependencies status](https://david-dm.org/guivic/fabric-node/status.svg)](https://david-dm.org/guivic/fabric-node#info=dependencies)
[![dev-dependencies status](https://david-dm.org/guivic/fabric-node/dev-status.svg)](https://david-dm.org/guivic/fabric-node#info=devDependencies)
[![Build Status](https://travis-ci.org/guivic/fabric-node.svg?branch=master)](https://travis-ci.org/guivic/fabric-node)
[![Coverage Status](https://coveralls.io/repos/github/guivic/fabric-node/badge.svg?branch=master)](https://coveralls.io/github/guivic/fabric-node?branch=master)
[![npm version](https://badge.fury.io/js/%40guivic%2Ffabric-node.svg)](https://badge.fury.io/js/%40guivic%2Ffabric-node)

node.js helpers to create quickly micro services and API

### Microservice
```javascript
(async function () {
	try {
		const PORT = process.env.PORT || 3000;
		const microService = new MicroService({
			port:       PORT, // default: 3000
			initMethod: () => { // default: () => {}
				console.log('code runned before starting the microservice');
			},
			bodyParserJSON: true, // body parser configured to accept json (default: false)
			fileUpload:     true, // to accept file upload (default: false)
			sentryDSN:      'SENTRY_KEY', // to configure sentry with the microservice (default: null)
		});

		await microService.start();
		console(`microservice listening on port ${PORT}`);
	} catch (error) {
		console.log(error.message);
	}
}());
```