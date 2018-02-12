const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const Joi = require('joi');

const optionsSchema = Joi.object().keys({
	apiKey: Joi.string().required(),
});

const MailProvider = require('./MailProvider');

/**
 * A mail provider that send mail through Sendgrid.
 */
class Sendgrid extends MailProvider {
	/**
	 * Check the options.
	 * @param {Object} options - Auth options.
	 */
	constructor(options) {
		super();

		const optionsValidated = Joi.validate(options, optionsSchema);
		if (optionsValidated.error) {
			throw optionsValidated.error;
		}

		this.options = optionsValidated.value;
	}

	/**
	 * Define the Sendgrid transporter.
	 * @return {Promise} An empty Promise.
	 */
	connect() {
		this.transporter = nodemailer.createTransport(
			nodemailerSendgrid({
				apiKey: this.options.apiKey,
			}),
		);
		return Promise.resolve();
	}
}

module.exports = Sendgrid;
