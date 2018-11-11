const Router = require('koa-router');
const koaBody = require('koa-body');
const validate = require('koa2-validation');
const Joi = require('joi');
const jwt = require('koa-jwt');

const methodsEnum = ['POST', 'GET', 'PUT', 'DELETE'];

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
	JWT_SECRET: Joi.string().optional().default(null),
	// before:     Joi.func().optional(),
});

const routesValidationSchema = Joi.object().keys({
	body:   Joi.object().optional(),
	params: Joi.object().optional(),
	query:  Joi.object().optional(),
}).optional();

/**
 * Return the joi schema for the action.
 * @param {String} action - An action from availaible actions or a custom one.
 * @return {Object} The joi schema.
 */
function generateRoutesDefinitionSchema(action) {
	const keys = {
		validation:  routesValidationSchema,
		isProtected: Joi.boolean().optional(),
	};

	if (availableActions.hasOwnProperty(action)) {
		keys.method = Joi.string().optional().default(availableActions[action].method);
		keys.endpoint = Joi.string().valid(methodsEnum)
			.optional().default(availableActions[action].endpoint);
	} else {
		keys.method = Joi.string().valid(methodsEnum).required();
		keys.endpoint = Joi.string().optional();
	}

	return Joi.object().keys(keys).optional();
}

const routesSchema = Joi.object().keys({
	create:  generateRoutesDefinitionSchema('create'),
	index:   generateRoutesDefinitionSchema('index'),
	get:     generateRoutesDefinitionSchema('get'),
	update:  generateRoutesDefinitionSchema('update'),
	delete:  generateRoutesDefinitionSchema('delete'),
	customs: Joi.object().pattern(/^/, generateRoutesDefinitionSchema('custom')),
});

const constructorSchema = Joi.object().keys({
	name:    Joi.string().required(),
	routes:  Joi.object().optional().default({}),
	options: Joi.object().optional().default({}),
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
	constructor(name, routes = {}, options = {}) {
		const { error: constructorError } = Joi.validate({ name, routes, options }, constructorSchema);
		if (constructorError) {
			throw new Error(`route-invalid-options: ${constructorError.message}`);
		}

		this._name = name;
		this._router = new Router();

		this._init(options);

		const { value: routesValidated, error } = Joi.validate(routes, routesSchema);
		if (error) {
			throw new Error(`route-invalid-options: ${error.message}`);
		}

		Object.keys(routesValidated).forEach((route) => {
			if (route === 'customs') {
				Object.keys(routesValidated[route]).forEach((customRoute) => {
					this._createRoute(customRoute, routesValidated.customs[customRoute]);
				});
			} else {
				this._createRoute(route, routesValidated[route]);
			}
		});
	}

	/**
	 * The endpoint of the route.
	 */
	get name() {
		return this._name;
	}

	/**
	 * The express router that will contains all routes.
	 */
	get router() {
		return this._router;
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
	}

	/**
	 * Create a route with the router instance.
	 * @param {String} action - The action (create, index, get, update, delete)
	 * @param {Object} { endpoint, method, validation, jwt } - An Object that defines a route
	 */
	_createRoute(action, {
		endpoint, method, validation = {}, isProtected = false,
	}) {
		const args = [`${this.name}${endpoint}`];

		if (isProtected) {
			if (!this.options.JWT_SECRET) {
				throw new Error(`route-invalid-jwt-secret: ${this.name}${endpoint} ${action}`);
			}
			args.push(jwt({ secret: this.options.JWT_SECRET }));
		}
		if (this.options.json) {
			args.push(koaBody());
		}
		args.push(validate(validation));
		args.push((ctx, next) => this[action](ctx, next));

		this._router[method.toLowerCase()](...args);
	}
}

module.exports = Route;
