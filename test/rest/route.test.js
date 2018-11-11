const { expect } = require('chai');
const Joi = require('joi');
const Route = require('../../src/api/rest/Route');

describe('Route', () => {
	beforeEach(() => {
	});

	it('Create an empty resolver', (done) => {
		const resolver = new Route('foo');

		expect(resolver).to.be.instanceof(Route);
		done();
	});

	it('Throw an error if invalid parameters sent to constructor', (done) => {
		expect(() => new Route()).to.throw('route-invalid-options: child "name" fails because ["name" is required]');

		done();
	});

	it('Throw an error if invalid routes options', (done) => {
		expect(() => new Route('foo', {
			foo: 'bar',
		})).to.throw('route-invalid-options: "foo" is not allowed');

		done();
	});

	it('Create /pets GET', (done) => {
		const route = new Route('pets', {
			index: {},
		});

		done();
	});

	it('Create /pets POST with json activated', (done) => {
		const route = new Route('pets', {
			create: {},
		}, {
			json: true,
		});

		done();
	});


	it('Throw an error if we try to create a /pets POST with an invalid JWT_SECRET', (done) => {
		expect(() => new Route('pets', {
			create: {
				validation: {
					body: {
						name: Joi.string().min(3).required(),
					},
				},
				isProtected: true,
			},
		})).to.throw('route-invalid-jwt-secret: pets create');

		done();
	});

	it('Create /pets POST with a jwt protection', (done) => {
		const route = new Route('pets', {
			create: {
				validation: {
					body: {
						name: Joi.string().min(3).required(),
					},
				},
				isProtected: true,
			},
		}, {
			JWT_SECRET: 'foo-bar',
		});

		done();
	});

	it('Create /pets/:id GET', (done) => {
		const route = new Route('pets', {
			get: {
				validation: {
					params: {
						id: Joi.number().required(),
					},
				},
			},
		});

		done();
	});

	it('Create /pets/:id PUT', (done) => {
		const route = new Route('pets', {
			update: {
				validation: {
					params: {
						id: Joi.number().required(),
					},
				},
			},
		});

		done();
	});

	it('Create /pets/:id DELETE', (done) => {
		const route = new Route('pets', {
			delete: {
				validation: {
					params: {
						id: Joi.number().required(),
					},
				},
			},
		});

		done();
	});

	it('Create a custom route /pets/:id/feed POST', (done) => {
		const route = new Route('pets', {
			customs: {
				feed: {
					method:     'POST',
					endpoint:   '/:id/feed',
					validation: {
						params: {
							id: Joi.number().required(),
						},
					},
				},
			},
		});

		done();
	});
});
