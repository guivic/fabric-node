/**
 * API
 */
const Gateway = require('./src/api/graphql/Gateway');
const Resolver = require('./src/api/graphql/Resolver');

const MicroService = require('./src/api/rest/MicroService');
const Route = require('./src/api/rest/Route');

const GraphqlAuthorizer = require('./src/api/graphql/GraphqlAuthorizer');
const RestAuthorizer = require('./src/api/rest/RestAuthorizer');


const Mail = require('./src/mail/Mail');
const Storage = require('./src/storage/Storage.js');

module.exports = {
	Gateway,
	Resolver,

	MicroService,
	Route,

	GraphqlAuthorizer,
	RestAuthorizer,

	Mail,
	Storage,
};
