const { expect } = require('chai');
const Joi = require('joi');
const Resolver = require('../../src/api/graphql/Resolver');

describe('Resolver', () => {
	beforeEach(() => {
		this.query = {
			getBeer: {
				validation: {
					id: Joi.number().required(),
				},
			},
		};

		this.mutation = {
			createBeer: {
				validation: {
					name: Joi.string(),
				},
			},
		};

		this.guinness = { id: 1, name: 'guinness' };
		this.createdGuinness = { id: 1 };
	});

	it('Create an empty resolver', (done) => {
		const resolver = new Resolver();

		expect(resolver).to.be.instanceof(Resolver);
		expect(resolver.getQuery()).to.be.empty;
		expect(resolver.getMutation()).to.be.empty;
		expect(resolver.getType()).to.be.empty;
		done();
	});

	it('Throw an error if invalid parameters sent to constructor', (done) => {
		expect(() => new Resolver({
			foo: 'bar',
		})).to.throw('resolver-invalid-options: "foo" is not allowed');

		done();
	});

	describe('Query', () => {
		it('Create a resolver with one query', (done) => {
			const resolver = new Resolver({
				query: this.query,
			});

			Reflect.set(resolver, 'getBeer', () => this.guinness);

			expect(resolver.getQuery()).to.have.property('getBeer');
			expect(resolver.getQuery().getBeer).to.be.a('Function');
			expect(resolver.getQuery().getBeer()).to.eventually.be.equal(this.guinness);

			done();
		});

		it('Throw an error if query method not found', (done) => {
			const resolver = new Resolver({
				query: this.query,
			});

			expect(resolver.getQuery().getBeer())
				.to.be.rejectedWith('resolver-method-not-found: getBeer');

			done();
		});

		it('Throw an error if invalid arguments', (done) => {
			const resolver = new Resolver({
				query: this.query,
			});

			Reflect.set(resolver, 'getBeer', () => this.guinness);

			expect(resolver.getQuery().getBeer({}, { foo: 'bar' }))
				.to.be.rejectedWith('child "id" fails because ["id" is required]');

			done();
		});

		it('Execute the query with a valid argument', (done) => {
			const resolver = new Resolver({
				query: this.query,
			});

			Reflect.set(resolver, 'getBeer', () => this.guinness);

			expect(resolver.getQuery().getBeer({}, { id: 1 }))
				.to.eventually.be.equal(this.guinness);

			done();
		});
	});

	describe('Mutation', () => {
		it('Create a resolver with one mutation', (done) => {
			const resolver = new Resolver({
				mutation: this.mutation,
			});

			Reflect.set(resolver, 'createBeer', () => this.createdGuinness);

			expect(resolver.getMutation()).to.have.property('createBeer');
			expect(resolver.getMutation().createBeer).to.be.a('Function');
			expect(resolver.getMutation().createBeer())
				.to.eventually.be.equal(this.createdGuinness);

			done();
		});

		it('Throw an error if mutation method not found', (done) => {
			const resolver = new Resolver({
				mutation: this.mutation,
			});

			expect(resolver.getMutation().createBeer())
				.to.be.rejectedWith('resolver-method-not-found: createBeer');

			done();
		});

		it('Throw an error if invalid arguments', (done) => {
			const resolver = new Resolver({
				mutation: this.mutation,
			});

			Reflect.set(resolver, 'createBeer', () => this.createdGuinness);

			expect(resolver.getMutation().createBeer({}, { foo: 'bar' }))
				.to.be.rejectedWith('"foo" is not allowed');

			done();
		});

		it('Execute the mutation with a valid argument', (done) => {
			const resolver = new Resolver({
				mutation: this.mutation,
			});

			Reflect.set(resolver, 'createBeer', () => this.createdGuinness);

			expect(resolver.getMutation().createBeer({}, { name: 'guinness' }))
				.to.eventually.be.equal(this.createdGuinness);

			done();
		});
	});
});
