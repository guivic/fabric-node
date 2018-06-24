const Koa = require('koa');
const cors = require('@koa/cors');
const morgan = require('koa-morgan');
const koaBody = require('koa-bodyparser');
const KoaRouter = require('koa-router');
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { makeExecutableSchema } = require('graphql-tools');

const { formatErrorGenerator, SevenBoom } = require('graphql-apollo-errors');
const Joi = require('joi');
const defaultLogger = require('winston-lludol');

const ddog = require('koa-datadog-middleware');
const Raven = require('raven');

const schema = Joi.object().keys({
	port:          Joi.number().integer().min(0).max(65535).optional().default(3000),
	graphqlSchema: Joi.object().optional().default({}),

	initMethod:    Joi.func().optional().default(() => Promise.resolve()),
	corsOptions:   Joi.object().optional().default({}),
	logger:        Joi.object().optional().default(defaultLogger),
	datadogConfig: Joi.object().optional().default({}),
	sentryDSN:     Joi.string().allow(null).optional().default(null),
});

/**
 * Represent a GraphQL gateway.
 */
class Gateway {
	/**
	 * Check if the options Object is valid.
	 * @param {Object} options - The gateway options.
	 */
	constructor(options) {
		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw new Error('gateway-invalid-options');
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
		this.app.use(koaBody());

		this._initDatadog();
		this._initErrorHandler();

		const router = new KoaRouter();

	 	const gschema = makeExecutableSchema({
			typeDefs:  this.options.graphqlSchema.typeDefs,
			resolvers: this.options.graphqlSchema.resolvers,

			allowUndefinedInResolve: true,
		});

		router.post('/graphql', graphqlKoa({
			schema:      gschema,
			formatError: formatErrorGenerator({
				logger,
				showLocations:     false,
				showPath:          true,
				hideSensitiveData: true,
				hooks:             {
					onProcessedError: (processedError) => {
						if (processedError.output) {
							logger.error(processedError.output);
						}

						logger.error(processedError.stack ? processedError.stack : processedError);

						if (this.options.sentryDSN) {
							Raven.captureException(processedError, (e, eventId) => {
								logger.info(`Reported error ${eventId}`);
							});
						}
					},
				},
				nonBoomTransformer: (nonBoomError) => {
					if (nonBoomError.isJoi) {
						return SevenBoom.badRequest(nonBoomError.message, {}, 'validation-error');
					}
					return SevenBoom.badImplementation(nonBoomError.message, nonBoomError.stack, nonBoomError.name);
				},
			}),
		}));
		router.get('/graphql', graphqlKoa({ schema: gschema }));
		router.get(
			'/graphiql',
			graphiqlKoa({
				endpointURL: '/graphql',
			}),
		);

		this.app.use(router.routes());
		this.app.use(router.allowedMethods());
	}

	/**
	 * Error handler that send errors to Sentry and display them.
	 * @param {String} type - The error type
	 * @param {Object} error - The error Object
	 */
	errorHandler(type, error) {
		logger.error(error.stack ? error.stack : error);

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
				ctx.status = 500;
				ctx.body = SevenBoom.badImplementation(error.message, error.stack, error.name);
				ctx.app.emit('error', error, ctx);
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
	 * Run the initMethod of the gateway.
	 * @return {Promise} - An empty Promise.
	 */
	_init() {
		return this.options.initMethod();
	}

	/**
	 * Launch the gateway.
	 * @param {Object} app - The Koa instance.
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

module.exports = Gateway;
