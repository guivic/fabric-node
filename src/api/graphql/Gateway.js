const Koa = require('koa');
const koaBody = require('koa-bodyparser');
const KoaRouter = require('koa-router');
const koaJwt = require('koa-jwt');
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { apolloUploadKoa } = require('apollo-upload-server');

const { makeExecutableSchema } = require('graphql-tools');

const { formatErrorGenerator, SevenBoom } = require('graphql-apollo-errors');
const Joi = require('joi');
const defaultLogger = require('winston-lludol');

const Raven = require('raven');

const API = require('../API');
const GraphqlAuthorizer = require('./GraphqlAuthorizer');

const schema = Joi.object().keys({
	port:          Joi.number().integer().min(0).max(65535).optional().default(3000),
	graphqlSchema: Joi.object().required(),
	graphqlUpload: Joi.boolean().optional().default(false),
	JWT_SECRET:    Joi.string().optional().default(null),
	production:    Joi.boolean().optional().default(false),
	staticPaths:   Joi.array().items(Joi.object().keys({
		url:  Joi.string().required(),
		path: Joi.string().required(),
	})).default([]),

	initMethod:     Joi.func().optional().default(() => Promise.resolve()),
	corsOptions:    Joi.object().optional().default({}),
	logger:         Joi.object().optional().default(defaultLogger),
	datadogConfig:  Joi.object().optional().default({}),
	sentryDSN:      Joi.string().allow(null).optional().default(null),
	requestLogging: Joi.boolean().optional().default(true),
	acl:            Joi.object().keys({
		enforcer:   Joi.func().required(),
		authorizer: Joi.object().optional().default(new GraphqlAuthorizer()),
	}).optional().default(null),
});

/**
 * Represent a GraphQL gateway.
 */
class Gateway extends API {
	/**
	 * Check if the options Object is valid.
	 * @param {Object} options - The gateway options.
	 */
	constructor(options = {}) {
		super();

		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw new Error(`gateway-invalid-options: ${error.message}`);
		}

		this.options = value;

		this._initSentry();

		process.on('unhandledRejection', (e) => this._errorHandler('unhandledRejection', e));
		process.on('uncaughtException', (e) => this._errorHandler('uncaughtException', e));

		this._initLogger();

		this.app = new Koa();

		this._initCors();
		this._initRequestLogger();

		this.app.use(koaBody());

		this._initStaticPaths();

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

		if (this.options.acl) {
			router.post('/graphql', this._aclMiddleware);
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
					return SevenBoom.badImplementation(
						nonBoomError.message,
						nonBoomError.stack,
						nonBoomError.name,
					);
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
}

module.exports = Gateway;
