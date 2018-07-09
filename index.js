const Mail = require('./src/mail/Mail');
const Gateway = require('./src/gateway/Gateway');
const Resolver = require('./src/gateway/Resolver');
const MicroService = require('./src/microservice/MicroService');
const Route = require('./src/microservice/Route');
const Storage = require('./src/storage/Storage.js');

module.exports = {
	Mail,
	Gateway,
	Resolver,
	MicroService,
	Route,
	Storage,
};
