const nodemailer = require('nodemailer');

const MailProvider = require('./MailProvider');

/**
 * A mail provider that create fake mail.
 */
class FakeMail extends MailProvider {
	/**
	 * Create the test account and define the transporter.
	 * @return {Promise} An empty Promise.
	 */
	connect() {
		return new Promise((resolve, reject) => {
			nodemailer.createTestAccount((error, account) => {
				if (error) {
					reject(error);
					return;
				}

				this.transporter = nodemailer.createTransport({
					host:   'smtp.ethereal.email',
					port:   587,
					secure: false,
					auth:   {
						user: account.user,
						pass: account.pass,
					},
				});

				resolve();
			});
		});
	}

	/**
	 * Method that add the previewUrl attribute to info Object.
	 * @param {Object} info - Informations about the email sent.
	 * @return {Object} The new info Object.
	 */
	afterMailSent(info) {
		info.previewUrl = nodemailer.getTestMessageUrl(info);
		return info;
	}
}

module.exports = FakeMail;
