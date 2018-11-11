const { expect } = require('chai');
const API = require('../src/api/API');

describe('API', () => {
	beforeEach(() => {
	});

	it('Throw an error if we try to instaciate the API class', (done) => {
		expect(() => new API())
			.to.throw('api-can-t-be-instancied');

		done();
	});
});
