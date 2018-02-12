const { Mail } = require('../../index');

(async function () {
	try {
		await Mail.use(Mail.providers.FAKE_MAIL);

		const info = await Mail.sendMail({
			from:    'from@test.com',
			to:      'to@test.com',
			subject: 'test subject',
			text:    'test content',
		});

		console.log(info);

		console.log(`You can see the mail at: ${info.previewUrl}`);
	} catch (error) {
		console.log(error);
	}
}());

