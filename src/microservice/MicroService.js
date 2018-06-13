const Koa = require('koa');
const cors = require('@koa/cors');
const morgan = require('koa-morgan');

const { SevenBoom } = require('graphql-apollo-errors');
const Joi = require('joi');
const defaultLogger = require('winston-lludol');

const ddog = require('koa-datadog-middleware');
const Raven = require('raven');

const schema = Joi.object().keys({
	port:          Joi.number().integer().min(0).max(65535).optional().default(3000),
	initMethod:    Joi.func().optional().default(() => Promise.resolve()),
	corsOptions:   Joi.object().optional().default({}),
	logger:        Joi.object().optional().default(defaultLogger),
	datadogConfig: Joi.object().optional().default({}),
	sentryDSN:     Joi.string().allow(null).optional().default(null),
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
			throw new Error('microservice-invalid-options');
		}

		this.options = value;

		this._initSentry();

		process.on('unhandledRejection', (e) => this.errorHandler('unhandledRejection', e));
		process.on('uncaughtException', (e) => this.errorHandler('uncaughtException', e));

		global.logger = this.options.logger;

		this.app = new Koa();
		this.app.use(cors(this.options.corsOptions));
		this.app.use(morgan('tiny', {
			stream: {
				write: (message) => {
					logger.info(message);
				},
			},
		}));

		this._initDatadog();
		this._initErrorHandler();
	}

	/**
	 * Error handler that send errors to Sentry and display them.
	 * @param {String} type - The error type
	 * @param {Object} error - The error Object
	 */
	errorHandler(type, error) {
		logger.error(error);

		if (this.options.sentryDSN) {
			Raven.captureException(
				error,
				{
					tags: {
						type,
					},
					level: 'fatal',
				},
				(sendError) => {
					if (sendError) {
						logger.error('Failed to send captured exception to Sentry');
					}
					process.exit(1);
				},
			);
		} else {
			process.exit(1);
		}
	}

	/**
	 * Initialize Sentry.
	 */
	_initSentry() {
		if (this.options.sentryDSN) {
			Raven.config(this.options.sentryDSN).install();
		}
	}

	/**
	 * Initialize the error middleware.
	 */
	_initErrorHandler() {
		this.app.use(async (ctx, next) => {
			try {
				await next();

				if (ctx.status === 404) {
					ctx.body = SevenBoom.notFound('Page not found', ctx.request.path, 'not-found');
				}
			} catch (error) {
				if (error.isBoom) {
					ctx.status = error.output.statusCode;
					ctx.body = error;
				} else if (error.status === 400) {
					ctx.status = 400;
					ctx.body = SevenBoom.badRequest(error.message, {}, 'validation-error');
				} else if (error.name === 'UnauthorizedError') {
					ctx.status = 401;
					ctx.body = SevenBoom.unauthorized(error.message, {}, error.name);
				} else {
					ctx.status = 500;
					ctx.body = SevenBoom.badImplementation(error.message, error.stack, error.name);
					ctx.app.emit('error', error, ctx);
				}
			}
		});

		this.app.on('error', (error) => {
			logger.error(error.stack ? error.stack : error);
			if (this.options.sentryDSN) {
				Raven.captureException(error, (e, eventId) => {
					logger.info(`Reported error ${eventId}`);
				});
			}
		});
	}

	/**
	 * Initiliaze Datadog middleware.
	 */
	_initDatadog() {
		if (this.options.datadogConfig) {
			this.app.use(ddog(this.options.datadogConfig));
		}
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
		this.app.use(route.router.routes());
		this.app.use(route.router.allowedMethods());
	}

	/**
	 * Launch the microservice.
	 * @param {Object} app - The Express.js instance.
	 * @return {Promise} - An empty Promise.
	 */
	async start() {
		await this._init();

		return new Promise((resolve) => {
			this.app.listen(this.options.port);
			resolve();
		});
	}
}

module.exports = MicroService;
