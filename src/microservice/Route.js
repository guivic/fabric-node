const Router = require('koa-router');
const koaBody = require('koa-body');
const validate = require('koa2-validation');
const Joi = require('joi');
const fileUpload = require('express-fileupload');
const lodashPick = require('lodash.pick');
const jwt = require('koa-jwt');

const availableActions = {
	create: {
		method:   'POST',
		endpoint: '',
	},
	index: {
		method:   'GET',
		endpoint: '',
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
	JWT_SECRET: Joi.string().optional().default(null),
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
		this._router = new Router();

		this._init(options);

		const defaultRoutes = lodashPick(routes, Object.keys(availableActions));
		// const customRoutes = lodashOmit(routes, Object.keys(availableActions));

		Object.keys(defaultRoutes).forEach((route) => {
			this._createRoute(route, availableActions[route], defaultRoutes[route].validation || {}, defaultRoutes[route].jwt || false);
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
	 * Initialize file upload middleware.
	 */
	_initFileUpload() {
		if (this.options.fileUpload) {
			this._router.use(fileUpload);
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

		// this._initFileUpload();
	}

	/**
	 * Create a route with the router instance.
	 * @param {String} action - The action (create, index, get, update, delete)
	 * @param {Object} { endpoint, method } - An Obejct with the endpoint and the associated method
	 * @param {Object} bodySchema - The joi schema associated with the route
	 * @param {Boolean} isProtected - True if the route is protected
	 */
	_createRoute(action, { endpoint, method }, bodySchema = {}, isProtected = false) {
		const args = [`${this.name}${endpoint}`];

		if (isProtected) {
			if (this.options.JWT_SECRET === null) {
				throw new Error(`route-invalid-jwt-secret: ${this.name}${endpoint} ${action}`);
			}
			args.push(jwt({ secret: this.options.JWT_SECRET }));
		}
		if (this.options.json) {
			args.push(koaBody());
		}
		args.push(validate(bodySchema));
		args.push((ctx, next) => this[action](ctx, next));

		this._router[method.toLowerCase()](...args);
	}
}

module.exports = Route;
