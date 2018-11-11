const { expect } = require('chai');
const MicroService = require('../../src/api/rest/MicroService');

describe('MicroService', () => {
	beforeEach(() => {
	});

	it('Create an empty gateway', (done) => {
		const microService = new MicroService();

		expect(microService).to.be.instanceof(MicroService);
		done();
	});

	it('Throw an error if invalid parameters sent to constructor', (done) => {
		expect(() => new MicroService(Object.assign({
			foo: 'bar',
		}))).to.throw('microservice-invalid-options: "foo" is not allowed');

		done();
	});
});
