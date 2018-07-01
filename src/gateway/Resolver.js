const Joi = require('joi');

/**
 * Define a GraphQL resolver with queries and mutations.
 */
class Resolver {
	/**
	 * Store queries and mutations.
	 * @param {Object} resolvers - The resolver config.
	 */
	constructor(resolvers) {
		this.type = resolvers.type || {};
		this.query = resolvers.query || {};
		this.mutation = resolvers.mutation || {};
	}

	/**
	 * Joi validate method async.
	 * @param {Object} args - The GraphQL arguments
	 * @param {Object} schema - The Joi schema
	 * @return {Promise} A Promise with the validated values.
	 */
	_validate(args, schema) {
		return new Promise((resolve, reject) => {
			Joi.validate(args, schema, (error, value) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(value);
			});
		});
	}

	/**
	 * Return a resolver with a joi middleware.
	 * @param {String} name - The name of the method.
	 * @param {Object} params - The object difinition of the method.
	 * @return {Function} An async function.
	 */
	_wrapper(name, params) {
		return async (obj, args, context, info) => {
			if (params.validation) {
				args = await this._validate(args, params.validation);
			}
			return this[name](obj, args, context, info);
		};
	}

	/**
	 * Return all query resolvers.
	 * @returns {Object} An Object that contains query methods.
	 */
	getQuery() {
		const queries = {};
		Object.keys(this.query).forEach((query) => {
			queries[query] = this._wrapper(query, this.query[query]);
		});
		return queries;
	}

	/**
	 * Return all mutation resolvers.
	 * @returns {Object} An Object that contains mutation methods.
	 */
	getMutation() {
		const mutations = {};
		Object.keys(this.mutation).forEach((mutation) => {
			mutations[mutation] = this._wrapper(mutation, this.mutation[mutation]);
		});
		return mutations;
	}

	/**
	 * Return type's resolvers.
	 * @returns {Object} An Object thant contains type and its resolver's fields.
	 */
	getType() {
		return this.type;
	}
}

module.exports = Resolver;
