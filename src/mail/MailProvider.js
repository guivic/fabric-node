const Joi = require('joi');

const mailOptionsSchema = Joi.object().keys({
	from:					Joi.string().email().required(),
	to:      			Joi.string().email().required(),
	subject: 			Joi.string().required(),
	text:    			Joi.string().required(),
	attachments:	Joi.array()
});

/**
 * An abtract class that represents a MailProvider
 */
class MailProvider {
	/**
	 * Set the transporter attributes.
	 */
	constructor() {
		this.transporter = null;
	}

	/**
	 * The connect method is where the transporter attribute must be initialized.
	 * @return {Promise} An empty Promise.
	 */
	connect() {
		return Promise.reject(new Error('mail-connect-method-not-found'));
	}

	/**
	 * Send a mail.
	 * @param {Object} mailOptions - The mail options.
	 * @return {Promise} a
	 */
	sendMail(mailOptions) {
		const mailOptionsValidated = Joi.validate(mailOptions, mailOptionsSchema);
		if (mailOptionsValidated.error) {
			throw mailOptionsValidated.error;
		}

		return new Promise((resolve, reject) => {
			this.transporter.sendMail(mailOptionsValidated.value, (error, info) => {
				if (error) {
					reject(error);
				}

				resolve(this.afterMailSent(info));
			});
		});
	}

	/**
	 * Method called after the mail is sent to do action with the info Object.
	 * @param {Object} info - The info Object.
	 * @return {Object} The new info Object.
	 */
	afterMailSent(info) {
		return info;
	}
}

module.exports = MailProvider;
