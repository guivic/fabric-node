const middlewareBefore = {
	middleware: (req, res, next) => {
		logger.info('Middleware before - about');
		next();
	},
	only: ['about'],
};

module.exports = [
	middlewareBefore,
];
