const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const Joi = require('joi');

const schema = Joi.object().keys({
	dist: Joi.string().required(),
	url:  Joi.string().uri().required(),
});

/**
 * Upload a file locally.
 */
class FsStorage {
	/**
	 * Check the options.
	 * @param {Object} options - The config for FsStorage.
	 */
	constructor(options) {
		const { value, error } = Joi.validate(options, schema);
		if (error) {
			throw new Error('FsStorage-invalid-options');
		}

		this.options = value;
	}

	/**
	 * Return the name of the Storage.
	 */
	get name() {
		return 'fs';
	}

	/**
	 * Get the URL of the current uploaded file.
	 * @param {String} filename - The filename
	 * @param {String} scope - The scope where the file is stored.
	 * @return {String} The url
	 */
	_getUrl(filename, scope) {
		return new URL(path.join(scope, filename), this.options.url).href;
	}

	/**
	 * Return the path where the file is stored.
	 * @param {String} filename - The name of the file
	 * @param {String} scope - The scope to create a folder
	 * @return {String} The path where the file is stored.
	 */
	_getPath(filename, scope) {
		return path.join(this.options.dist, scope, filename);
	}

	/**
	 * Store a file on the disk.
	 * @param {Object} data - The file data (Stream, Buffer, String, etc)
	 * @param {String} filename - The name of the file
	 * @param {String} scope - The scope to create a folder
	 * @return {String} The url of the saved file.
	 */
	async upload(data, filename, scope = '') {
		await fs.ensureDir(path.join(this.options.dist, scope));
		if (data.constructor && data.constructor.name === 'FileStream') {
			const writeStream = fs.createWriteStream(path.join(this.options.dist, scope, filename));
			return new Promise((resolve, reject) => {
				data
					.pipe(writeStream)
					.on('finish', () => {
						resolve(this._getUrl(filename, scope));
					})
					.on('error', (e) => reject(e));
			});
		}
		await fs.outputFile(path.join(this.options.dist, scope, filename), data);
		return Promise.resolve(this._getUrl(filename, scope));
	}

	/**
	 * Return the readdable stream of the file.
	 * @param {String} filename - The name of the file
	 * @param {String} scope - The scope to create a folder
	 * @return {Stream} The stream of the file.
	 */
	async download(filename, scope = '') {
		const p = this._getPath(filename, scope);
		await fs.ensureFile(p);
		return fs.createReadStream(p);
	}
}

module.exports = FsStorage;
