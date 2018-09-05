const Koa = require('koa');
const cors = require('@koa/cors');
const morgan = require('koa-morgan');
const koaBody = require('koa-bodyparser');
const KoaRouter = require('koa-router');
const koaJwt = require('koa-jwt');
const koaStatic = require('koa-static');
const koaMount = require('koa-mount');
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { apolloUploadKoa } = require('apollo-upload-server');

const { makeExecutableSchema } = require('graphql-tools');

const { formatErrorGenerator, SevenBoom } = require('graphql-apollo-errors');
const Joi = require('joi');
const defaultLogger = require('winston-lludol');

const ddog = require('koa-datadog-middleware');
const Raven = require('raven');

const schema = Joi.object().keys({
	port:          Joi.number().integer().min(0).max(65535).optional().default(3000),
	graphqlSchema: Joi.object().optional().default({}),
	graphqlUpload: Joi.boolean().optional().default(false),
	JWT_SECRET:    Joi.string().optional().default(null),
	production:    Joi.boolean().optional().default(false),
	staticPaths:   Joi.array().items(Joi.object().keys({
		url:  Joi.string().required(),
		path: Joi.string().required(),
	})).default([]),

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

		if (this.options.corsOptions && Object.keys(this.options.corsOptions).length > 0) {
			this.app.use(cors(this.options.corsOptions));
		} else {
			this.app.use(cors());
		}

		this.app.use(morgan('tiny', {
			stream: {
				write: (message) => {
					logger.info(message);
				},
			},
		}));
		this.app.use(koaBody());

		this.options.staticPaths.forEach((staticPath) => {
			this.app.use(koaMount(staticPath.url, koaStatic(staticPath.path)));
		});

		this._initDatadog();
		this._initErrorHandler();

		const router = new KoaRouter();

		const gschema = makeExecutableSchema({
			typeDefs:  this.options.graphqlSchema.typeDefs,
			resolvers: this.options.graphqlSchema.resolvers,
		});

		if (this.options.JWT_SECRET) {
			router.post('/graphql', koaJwt({ secret: this.options.JWT_SECRET, passthrough: true }));
		}

		router.post('/graphql', this.options.graphqlUpload ? apolloUploadKoa() : (ctx, next) => next(), graphqlKoa((ctx) => ({
			schema:  gschema,
			context: {
				user: ctx.state && ctx.state.user ? ctx.state.user : null,
			},
			formatError: formatErrorGenerator({
				logger,
				showLocations:     false,
				showPath:          true,
				hideSensitiveData: this.options.production,
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
		})));
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
	 * Add a route to the microservice.
	 * @param {Route} route - An instance of Route.
	 */
	addRoute(route) {
		this.app.use(route.router.routes());
		this.app.use(route.router.allowedMethods());
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
