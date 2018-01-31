# fabric-node
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