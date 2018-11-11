const cors = require('koa2-cors');
const morgan = require('koa-morgan');
const koaStatic = require('koa-static');
const koaMount = require('koa-mount');
const ddog = require('koa-datadog-middleware');
const Raven = require('raven');
const { SevenBoom } = require('graphql-apollo-errors');

/**
 * API contains method that will be used by Gateway and MicroService.
 */
class API {
	/**
	 * The API constructor.
	 */
	constructor() {
		if (this.constructor === API) {
			throw new Error('api-can-t-be-instancied');
		}
	}

	/**
	 * Initialize the global logger..
	 */
	_initLogger() {
		global.logger = this.options.logger;
	}

	/**
	 * Initialize the error middleware.
	 */
	_initErrorHandler() {
		this.app.use(async (ctx, next) => {
			try {
				if (ctx.status === 403) {
					return;
				}

				await next();

				if (ctx.status === 404) {
					ctx.status = 404;
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
	 * Error handler that send errors to Sentry and display them.
	 * @param {String} type - The error type
	 * @param {Object} error - The error Object
	 */
	_errorHandler(type, error) {
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
				},
			);
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
	 * Initiliaze the API cors.
	 */
	_initCors() {
		if (this.options.corsOptions && Object.keys(this.options.corsOptions).length > 0) {
			this.app.use(cors(this.options.corsOptions));
		} else {
			this.app.use(cors());
		}
	}

	/**
	 * Initiliaze the API request logger (morgan).
	 */
	_initRequestLogger() {
		if (this.options.requestLogging) {
			this.app.use(morgan('tiny', {
				stream: {
					write: (message) => {
						logger.info(message);
					},
				},
			}));
		}
	}

	/**
	 * Return the ACL middleware funciton.
	 */
	get _aclMiddleware() {
		return async (ctx, next) => {
			const enforcer = await this.options.acl.enforcer();
			const { authorizer } = this.options.acl;

			if (!authorizer.checkPermission(ctx, enforcer)) {
				authorizer.onError(ctx);
			}
			await next();
		};
	}

	/**
	 * Initiliaze the ACL with koa-authz and casbin.
	 */
	_initAcl() {
		if (this.options.acl) {
			this.app.use(this.aclMiddleware);
		}
	}

	/**
	 * Initiliaze the static paths.
	 */
	_initStaticPaths() {
		this.options.staticPaths.forEach((staticPath) => {
			this.app.use(koaMount(staticPath.url, koaStatic(staticPath.path)));
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
	 * Add a route to the microservice.
	 * @param {Route} route - An instance of Route.
	 */
	addRoute(route) {
		this.app.use(route.router.routes());
		this.app.use(route.router.allowedMethods());
	}

	/**
	 * Run the initMethod of the gateway.
	 * @return {Promise} - An empty Promise.
	 */
	_init() {
		return this.options.initMethod();
	}

	/**
	 * Launch the microservice.
	 * @param {Object} app - The Koa instance.
	 * @return {Promise} - An empty Promise.
	 */
	async start() {
		await this._init();

		return new Promise((resolve) => {
			resolve(this.app.listen(this.options.port));
		});
	}
}

module.exports = API;
