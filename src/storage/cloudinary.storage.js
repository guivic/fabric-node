const path = require('path');
const Joi = require('joi');
const Cloudinary = require('cloudinary');

const schema = Joi.object().keys({
	cloud_name: Joi.string().required(),
	api_key:    Joi.string().required(),
	api_secret: Joi.string().required(),
	root:       Joi.string().optional().default(null),
});

/**
 * Upload a file to cloudinary.
 */
class CloudinaryStorage {
	/**
	* Check the options.
	* @param {Object} options - The config for CloudinaryStorage.
	*/
	constructor(options) {
		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw new Error('CloudinaryStorage-invalid-options');
		}

		this.options = value;

		Cloudinary.config({
			cloud_name: this.options.cloud_name,
			api_key:    this.options.api_key,
			api_secret: this.options.api_secret,
		});
	}

	/**
	 * Return the name of the Storage.
	 */
	get name() {
		return 'cloudinary';
	}

	/**
	 * Return the generated public_id for Cloudinary.
	 * @param {String} filename - The filename
	 * @param {String} scope - Scope of the file (the folder)
	 * @return {String} The public id.
	 */
	_getPublicId(filename, scope = '') {
		if (this.options.root) {
			return path.join(this.options.root, scope, filename);
		}
		return path.join(scope, filename);
	}

	/**
	 * Upload the file to cloudinary.
	 * @param {Object} data - The file (stream, buffer, string, etc)
	 * @param {String} filename - The filename
	 * @param {String} scope - The scope where to store the file
	 * @return {String} Return the url.
	 */
	upload(data, filename, scope = '') {
		return new Promise((resolve, reject) => {
			const cloudinaryStream = Cloudinary.uploader.upload_stream((error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result.secure_url);
			}, { public_id: this._getPublicId(filename, scope) });
			if (data.constructor && data.constructor.name === 'FileStream') {
				data
					.pipe(cloudinaryStream)
					.on('error', (error) => reject(error));
			} else {
				cloudinaryStream.end(data);
			}
		});
	}
}

module.exports = CloudinaryStorage;
