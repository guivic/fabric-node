const express = require('express');
const Joi = require('joi');
const cors = require('cors');

const schema = Joi.object().keys({
	port:        Joi.number().integer().min(0).max(65535).optional().default(3000),
	initMethod:  Joi.func().optional().default(() => Promise.resolve()),
	corsOptions: Joi.object().optional().default({}),
});

/**
 * Represent a microservice (a REST API) launched with Express.js.
 */
class MicroService {
	/**
	 * Check if the options Object is valid.
	 * @param {Object} options - The microservice options.
	 */
	constructor(options) {
		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw error;
		}

		this.options = value;
		this.app = express();
		this.app.use(cors(this.options.corsOptions));
	}

	/**
	 * Run the initMethod of the microservice.
	 * @return {Promise} - An empty Promise.
	 */
	_init() {
		return this.options.initMethod();
	}

	/**
	 * Add a route to the microservice.
	 * @param {Route} route - An instance of Route.
	 */
	addRoute(route) {
		this.app.use(route.name, route.router);
	}

	/**
	 * Launch the microservice.
	 * @param {Object} app - The Express.js instance.
	 * @return {Promise} - An empty Promise.
	 */
	async start() {
		await this._init();

		return new Promise((resolve) => {
			this.app.listen(this.options.port, () => {
				resolve();
			});
		});
	}
}

module.exports = MicroService;
