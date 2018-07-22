const FSStorageProvider = require('./fs.storage.js');
const CloudinaryStorageProvider = require('./cloudinary.storage.js');
const GoogleCloudStorageProvider = require('./googleCloud.storage');

/**
 * Singleotn that handle multiple storage provider.
 */
class Storage {
	/**
	 * Initilialize the list of providers.
	 */
	constructor() {
		this._providers = {
			FS:          FSStorageProvider,
			CLOUDINARY:  CloudinaryStorageProvider,
			GOOGLECLOUD: GoogleCloudStorageProvider,
		};
	}

	/**
	 * Set the storage that will be used.
	 * @param {String} provider - The stortage provider.
	 * @param {Object} options - Configuration for provider.
	 */
	use(provider, options) {
		const ProviderClass = this._providers[provider.toUpperCase()];
		if (!ProviderClass) {
			throw new Error('storage-invalid-provider');
		}
		this.provider = new ProviderClass(options);
	}

	/**
	 * Upload the file.
	 * @param {Object} stream - The stream of the file.
	 * @param {String} filename - The name of the file.
	 * @param {String} scope - The scope to know where to store the file.
	 * @return {Object} An Object with the uploaded file informations
	 */
	async upload(stream, filename, scope) {
		try {
			const url = await this.provider.upload(stream, filename, scope);
			return {
				provider: this.provider.name,
				url,
				filename,
			};
		} catch (error) {
			logger.error(error);
			return null;
		}
	}
}

module.exports = new Storage();
