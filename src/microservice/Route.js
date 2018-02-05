const bodyParser = require('body-parser');
const express = require('express');
const Joi = require('joi');
const expressJoiMiddleware = require('express-joi-middleware');
const Raven = require('raven');
const fileUpload = require('express-fileupload');
const lodashOmit = require('lodash.omit');
const lodashPick = require('lodash.pick');

const asyncMiddleware = require('./asyncMiddleware');

const availableActions = {
	create: {
		method:   'POST',
		endpoint: '/',
	},
	index: {
		method:   'GET',
		endpoint: '/',
	},
	get: {
		method:   'GET',
		endpoint: '/:id',
	},
	update: {
		method:   'PUT',
		endpoint: '/:id',
	},
	delete: {
		method:   'DELETE',
		endpoint: '/:id',
	},
};

const routeOptionsSchema = Joi.object().keys({
	json:       Joi.boolean().optional().default(false),
	fileUpload: Joi.boolean().optional().default(false),
	sentryDSN:  Joi.string().optional().default(null),
	// before:     Joi.func().optional(),
});

/**
 * Represent a Route with Express.Router();
 */
class Route {
	/**
	 * Set the name and create route with each body schema.
	 * @param {String} name - The name of the endpoint
	 * @param {Object} routes - An Object that countains routes endpoint and body schemas.
	 * @param {Object} options - An Object that contains route options.
	 */
	constructor(name, routes, options = {}) {
		this._name = name;
		this._router = express.Router();

		this._init(options);

		const defaultRoutes = lodashPick(routes, Object.keys(availableActions));
		// const customRoutes = lodashOmit(routes, Object.keys(availableActions));

		Object.keys(defaultRoutes).forEach((route) => {
			this._createRoute(route, availableActions[route], defaultRoutes[route].validation || {});
		});
	}

	/**
	 * The endpoint of the route.
	 */
	get name() {
		return this._name;
	}

	/**
	 * The express router thant contains the route.
	 */
	get router() {
		return this._router;
	}


	/**
	 * Initialize body parser middleware.
	 */
	_initBodyParser() {
		if (this.options.json) {
			this._router.use(bodyParser.urlencoded({ extended: false }));
			this._router.use(bodyParser.json());
		}
	}

	/**
	 * Initialize file upload middleware.
	 */
	_initFileUpload() {
		if (this.options.fileUpload) {
			this._router.use(fileUpload);
		}
	}

	/**
	 * Initialize Sentry middleware.
	 */
	_initSentry() {
		if (this.options.sentryDSN) {
			Raven.config(this.options.sentryDSN).install();
			this._router.use(Raven.requestHandler());
		}
	}

	/**
	 * Initialize Sentry error handler middleware.
	 */
	_initSentryErrorHandler() {
		if (this.options.sentryDSN) {
			this._router.use(Raven.errorHandler());
		}
	}

	/**
	 * Parse options Object and use middleware.
	 * @param {Object} options - The route options.
	 */
	_init(options) {
		const { value, error } = Joi.validate(options, routeOptionsSchema);
		if (error) {
			throw error;
		}

		this.options = value;

		this._initSentry();
		this._initBodyParser();
		this._initFileUpload();
		this._initSentryErrorHandler();
	}

	/**
	 * Return a default endpoint for default actions.
	 * @param {String} action - A valid action (create, index, get, update, delete)
	 * @return {String} The default endpoint.
	 */
	_getDefaultEndpoint(action) {
		let endpoint = '/';

		if (action === 'update' || action === 'get' || action === 'delete') {
			endpoint += ':id';
		}

		return endpoint;
	}

	/**
	 * Create a route with the router instance.
	 * @param {String} action - The action (create, index, get, update, delete)
	 * @param {String} method - get, post, put, delete
	 * @param {String} endpoint - The route endpoint
	 * @param {Object} bodySchema - The joi schema associated with the route
	 */
	_createRoute(action, method, endpoint, bodySchema = {}) {
		this._router[method.toLowerCase()](
			endpoint,
			expressJoiMiddleware(bodySchema),
			asyncMiddleware((req, res, next) => this[action](req, res, next)),
		);
	}
}

module.exports = Route;
