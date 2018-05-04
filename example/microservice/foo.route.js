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

	create(req, res) {
		const name = req.validated.body.name;

		const entry = {
			id: this.nextId,
			name,
		};

		this.foos.push(entry);

		res.json(entry);
	}

	index(req, res) {
		res.json(this.foos);
	}

	get(req, res) {
		const id = req.validated.params.id;

		const entry = this.foos.find((e) => e.id === id);
		if (!entry) {
			res.status(404);
		}

		res.json(entry);
	}

	update(req, res) {
		const id = req.validated.params.id;
		const name = req.validated.body.name;

		const entryIndex = this.foos.findIndex((e) => e.id === id);
		if (entryIndex === -1) {
			res.status(404);
		}

		this.foos[entryIndex].name = name;

		res.json(this.foos[entryIndex]);
	}

	delete(req, res) {
		const id = req.validated.params.id;

		const entryIndex = this.foos.findIndex((e) => e._id === id);
		if (entryIndex === -1) {
			res.status(404);
		}

		this.foos.splice(entryIndex, 1);

		res.json({});
	}

	about(req, res, next) {
		res.json({
			message: 'Custom route ABOUT',
		});
	}
}

module.exports = Foo;
