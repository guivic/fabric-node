const { expect } = require('chai');
const Joi = require('joi');
const Gateway = require('../../src/api/graphql/Gateway');

describe('Gateway', () => {
	beforeEach(() => {
		const Beer = `
			type Beer {
				id: Int!
				name: String
			}
		`;

		const RootQuery = `
			type RootQuery {
				getBeer(id: Int!): Beer
			}
		`;

		const SchemaDefinition = `
			schema {
				query: RootQuery
			}
		`;

		this.defaultOptions = {
			graphqlSchema: {
				typeDefs:  [SchemaDefinition, RootQuery, Beer],
				resolvers: {},
			},
		};
	});

	it('Create an empty gateway', (done) => {
		const gateway = new Gateway(this.defaultOptions);

		expect(gateway).to.be.instanceof(Gateway);
		done();
	});

	it('Throw an error if invalid parameters sent to constructor', (done) => {
		expect(() => new Gateway(Object.assign(this.defaultOptions, {
			foo: 'bar',
		}))).to.throw('gateway-invalid-options: "foo" is not allowed');

		done();
	});
});
