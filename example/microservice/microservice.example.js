const logger = require('winston-lludol');

const { MicroService } = require('../../index');
const { name } = require('./package.json');
const Foo = require('./foo.route');

const PORT = process.env.PORT || 8080;

(async function () {
	try {
		const microService = new MicroService({
			port:       PORT,
			initMethod: () => {
				logger.info('code runned before starting the microservice');
			},
		});

		const foo = new Foo();
		microService.addRoute(foo);

		await microService.start();
		logger.info(`[${name}] listening on port ${PORT}`);
	} catch (error) {
		console.log(error);
		logger.error(error);
	}
}());
