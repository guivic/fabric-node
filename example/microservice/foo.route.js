/* eslint-disable require-jsdoc */
const Joi = require('joi');

const fooMiddlewares = require('./foo.middleware');

const { Route } = require('../../index');

class Foo extends Route {
	constructor() {
		super('/foos', {
			create: {
				validation: {
					body: {
						name: Joi.string().required(),
					},
				},
			},
			index: {},
			get:   {
				validation: {
					params: {
						id: Joi.number().required(),
					},
				},
			},
			update: {
				validation: {
					params: {
						id: Joi.number().required(),
					},
					body: {
						name: Joi.string().required(),
					},
				},
			},
			delete: {
				validation: {
					params: {
						id: Joi.number().required(),
					},
				},
			},
		}, {
			json: true,
		});

		this.nextId = 1;
		this.foos = [];
	}

	create(ctx, next) {
		const { name } = ctx.request.body;

		const entry = {
			id: this.nextId,
			name,
		};

		this.foos.push(entry);

		ctx.body = entry;
		return next();
	}

	index(ctx, next) {
		ctx.body = this.foos;
		return next();
	}

	get(ctx, next) {
		const id = Number.parseInt(ctx.params.id, 10);

		const entry = this.foos.find((e) => e.id === id);
		if (!entry) {
			ctx.status = 404;
			return next();
		}

		ctx.body = entry;
		return next();
	}

	update(ctx, next) {
		const id = Number.parseInt(ctx.params.id, 10);
		const { name } = ctx.request.body;

		const entryIndex = this.foos.findIndex((e) => e.id === id);
		if (entryIndex === -1) {
			ctx.status = 404;
			return next();
		}

		this.foos[entryIndex].name = name;

		ctx.body = this.foos[entryIndex];
		return next();
	}

	delete(ctx, next) {
		const id = Number.parseInt(ctx.params.id, 10);

		const entryIndex = this.foos.findIndex((e) => e._id === id);
		if (entryIndex === -1) {
			ctx.status = 404;
			return next();
		}

		this.foos.splice(entryIndex, 1);

		ctx.body = {};
		return next();
	}

	about(ctx, next) {
		ctx.body = {
			message: 'Custom route ABOUT',
		};
		return next();
	}
}

module.exports = Foo;
