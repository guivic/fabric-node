const { SevenBoom } = require('graphql-apollo-errors');

/**
 * The default RestAuthorizer to for ACL.
 */
class RestAuthorizer {
	/**
	 * Return the role of the user that make the request.
	 * Default: Fetch the role attribute from user in Koa context Object.
	 * @param {Object} ctx - The Koa context
	 * @return {String} The role
	 */
	getUserRole(ctx) {
		if (ctx.state && ctx.state.user) {
			return ctx.state.user.role || 'guest';
		}
		return 'guest';
	}

	/**
	 * Check if the user has the right to do the action.
	 * Default: get path and method from the Koa context and check with getUserRole if the user
	 * has the right.
	 * @param {Object} ctx - The Koa context
	 * @param {Object} enforcer - The enforcer instance
	 * @return {Boolean} True if the user has the right to do the action
	 */
	checkPermission(ctx, enforcer) {
		const { originalUrl: path, method } = ctx;
		const role = this.getUserRole(ctx);
		return enforcer.enforce(role, path, method);
	}

	/**
	 * Method call if the user don't have the right to do the action.
	 * Default: set status request to 403 with a forbidden SevenBoom error in the body.
	 * @param {Object} ctx - The Koa context
	 */
	onError(ctx) {
		ctx.status = 403;
		ctx.body = SevenBoom.forbidden('', {}, 'fobidden');
	}
}

module.exports = RestAuthorizer;
