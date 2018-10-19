const FakeMail = require('./FakeMailProvider');
const Sendgrid = require('./SendGridProvider');
const Mandrill = require('./MandrillProvider');

/**
 * Mail is a singleton that can send email
 */
class Mail {
	/**
	 * Define every available providers..
	 */
	constructor() {
		this.providers = {
			FAKE_MAIL: FakeMail,
			SENDGRID:  Sendgrid,
			MANDRILL:  Mandrill,
		};
	}

	/**
	 * Initiliaze and set a MailProvider.
	 * @param {MailProvider} Provider - The Provider
	 * @param {Object} options - Options sent to initialize the Provider.
	 * @return {Promise} An empty Promise.
	 */
	async use(Provider, options) {
		if (Reflect.getPrototypeOf(Provider).name !== 'MailProvider') {
			throw Error('mail-invalid-provider');
		}

		this.mailProvider = new Provider(options);
		await this.mailProvider.connect();
		return Promise.resolve();
	}

	/**
	 * Send a mail with the Provider.
	 * @param {Object} mailOptions - The mail options.
	 * @return {Promise} A Promise that contains informations about the mail sent.
	 */
	sendMail(mailOptions) {
		return this.mailProvider.sendMail(mailOptions);
	}
}

module.exports = new Mail();
