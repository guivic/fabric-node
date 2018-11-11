const Koa = require('koa');

const Joi = require('joi');
const defaultLogger = require('winston-lludol');

const API = require('../API');
const RestAuthorizer = require('./RestAuthorizer');

const schema = Joi.object().keys({
	port:          Joi.number().integer().min(0).max(65535).optional().default(3000),
	initMethod:    Joi.func().optional().default(() => Promise.resolve()),
	corsOptions:   Joi.object().optional().default({}),
	logger:        Joi.object().optional().default(defaultLogger),
	datadogConfig: Joi.object().optional().default({}),
	sentryDSN:     Joi.string().allow(null).optional().default(null),
	staticPaths:   Joi.array().items(Joi.object().keys({
		url:  Joi.string().required(),
		path: Joi.string().required(),
	})).default([]),
	requestLogging: Joi.boolean().optional().default(true),
	acl:            Joi.object().keys({
		enforcer:   Joi.func().required(),
		authorizer: Joi.object().optional().default(new RestAuthorizer()),
	}).optional().default(null),
});

/**
 * Represent a microservice (a REST API).
 */
class MicroService extends API {
	/**
	 * Check if the options Object is valid.
	 * @param {Object} options - The microservice options.
	 */
	constructor(options = {}) {
		super();

		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw new Error(`microservice-invalid-options: ${error.message}`);
		}

		this.options = value;

		this._initSentry();

		process.on('unhandledRejection', (e) => this._errorHandler('unhandledRejection', e));
		process.on('uncaughtException', (e) => this._errorHandler('uncaughtException', e));

		this._initLogger();

		this.app = new Koa();

		this._initCors();
		this._initRequestLogger();

		this._initAcl();

		this._initDatadog();
		this._initErrorHandler();
	}
}

module.exports = MicroService;
