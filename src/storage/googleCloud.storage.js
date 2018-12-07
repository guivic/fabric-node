const Storage = require('@google-cloud/storage');

const path = require('path');
const Joi = require('joi');

const schema = Joi.object().keys({
	bucket:      Joi.string().required(),
	credentials: Joi.object().required(),
});

/**
 * Upload a file to the google cloud storage.
 */
class GoogleCloudStorage {
	/**
	* Check the options.
	* @param {Object} options - The config for GoogleCloudStorage.
	*/
	constructor(options) {
		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw new Error('GoogleCloudStorage-invalid-options');
		}

		this.options = value;

		this._storage = new Storage({
			credentials: this.options.credentials,
		});

		this._bucket = this._storage.bucket(this.options.bucket);
	}

	/**
	 * Return the name of the Storage.
	 */
	get name() {
		return 'googleCloud';
	}

	/**
	 * Return the generated path for Google Cloud Storage.
	 * @param {String} filename - The filename
	 * @param {String} scope - Scope of the file (the folder)
	 * @return {String} The destiation path.
	 */
	_getDestPath(filename, scope = '') {
		if (this.options.root) {
			return path.join(this.options.root, scope, filename);
		}
		return path.join(scope, filename);
	}

	/**
	 * Upload the file to Google Cloud Storage.
	 * @param {Object} data - The file (stream, buffer, string, etc)
	 * @param {String} filename - The filename
	 * @param {String} scope - The scope where to store the file
	 * @return {String} Return the url.
	 */
	upload(data, filename, scope = '') {
		const destination = this._getDestPath(filename, scope);
		const file = this._bucket.file(destination);

		return new Promise((resolve, reject) => {
			data
				.pipe(file.createWriteStream({}))
				.on('finish', () => {
					resolve(`https://storage.googleapis.com/${this.options.bucket}/${destination}`);
				})
				.on('error', (error) => reject(error));
		});
	}

	/**
	 * Return the readdable stream of the file.
	 * @param {String} filename - The name of the file
	 * @param {String} scope - The scope to create a folder
	 * @return {Stream} The stream of the file.
	 */
	download(filename, scope = '') {
		const remoteFile = this._bucket.file(this._getDestPath(filename, scope));
		return remoteFile.createReadStream();
	}
}

module.exports = GoogleCloudStorage;
