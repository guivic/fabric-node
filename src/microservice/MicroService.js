const bodyParser = require('body-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const Joi = require('joi');
const Raven = require('raven');

const schema = Joi.object().keys({
	port:           Joi.number().integer().min(0).max(65535).optional().default(3000),
	initMethod:     Joi.func().optional().default(() => Promise.resolve()),
	bodyParserJSON: Joi.boolean().optional().default(false),
	fileUpload:     Joi.boolean().optional().default(false),
	sentryDSN:      Joi.string().optional().default(null),
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
		const result = Joi.validate(options, schema);
		if (result.error) {
			throw result.error;
		}

		this.options = result.value;
		this.app = express();
	}

	/**
	 * Initialize body parser middleware.
	 */
	_initBodyParser() {
		if (this.options.bodyParserJSON) {
			this.app.use(bodyParser.urlencoded({ extended: false }));
			this.app.use(bodyParser.json());
		}
	}

	/**
	 * Initialize file upload middleware.
	 */
	_initFileUpload() {
		if (this.options.fileUpload) {
			this.app.use(fileUpload);
		}
	}

	/**
	 * Initialize Sentry middleware.
	 */
	_initSentry() {
		if (this.options.sentryDSN) {
			Raven.config(this.options.sentryDSN).install();
			this.app.use(Raven.requestHandler());
		}
	}

	/**
	 * Initialize Sentry error handler middleware.
	 */
	_initSentryErrorHandler() {
		if (this.options.sentryDSN) {
			this.app.use(Raven.errorHandler());
		}
	}

	/**
	 * Run the initMethod of the microservice.
	 * @return {Promise} - An empty Promise.
	 */
	_init() {
		this._initSentry();
		this._initBodyParser();
		this._initFileUpload();
		this._initSentryErrorHandler();

		return this.options.initMethod();
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
