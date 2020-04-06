# fabric-node
[![dependencies status](https://david-dm.org/guivic/fabric-node/status.svg)](https://david-dm.org/guivic/fabric-node#info=dependencies)
[![dev-dependencies status](https://david-dm.org/guivic/fabric-node/dev-status.svg)](https://david-dm.org/guivic/fabric-node#info=devDependencies)
[![Build Status](https://travis-ci.org/guivic/fabric-node.svg?branch=master)](https://travis-ci.org/guivic/fabric-node)
[![Coverage Status](https://coveralls.io/repos/github/guivic/fabric-node/badge.svg?branch=master)](https://coveralls.io/github/guivic/fabric-node?branch=master)
[![npm version](https://badge.fury.io/js/%40guivic%2Ffabric-node.svg)](https://badge.fury.io/js/%40guivic%2Ffabric-node)

fabric-node let you create REST (with [Koa](https://github.com/koajs/koa)) and GraphQL (with [Apollo Server](https://github.com/apollographql/apollo-server)) api by letting you focus on the code and logic of your application instead of the framework configuration.

Powered by [Guivic](https://guivic.io)

## Installation

Fabric-node requires __node v8__ or higher.

```
$ yarn add @guivic/fabric-node
```

## Documentation

 - [Getting started](docs/index.md)

 - [What is the purpose ?](#what-is-the-purpose-?)

 - [How to contribute ?](#how-to-contribute-?)

 - [Running tests](#running-tests)

 - [License](#License)

## What is the purpose ?

I have created fabric-node because I am tired of configuring again and again web frameworks like Koa.js or ApolloServer.

The purpose of fabric-node is to let you focus on the code of your application (handlers or resolvers) without thinking about the fact that you have well configured the framework.

For example, in Koa, if you want to have a production ready API with JWT auth, ACL and logs you will have to try multiple solutions, learn each modules, see which one is not working as well as you want, etc.

With fabric-node, you will just have to go through the documentation to see how to activate what you want.
For example, you need a JWT authentification ? This is easy, just send your JWT_SECRET to fabric-node, tell me which route need to be "protected" with just a boolean and tada: it works and it's production ready!

#### Ok it sounds fun but I need to plug a coffee machine to my API how can I do that?

This is not a problem, the code is well documented, you have two solutions:
- develop your feature and make a PR. See [How to contribute](#how-to-contribute)
- create an issue and let me add it to the code

The goal is to create something that handle all of the common needs for a basic production API.

## How to contribute ?

- Don't hesitate to create a PR if something is missing (and don't forget to write some tests)
- Help me improving the [documentation](docs/index.md)


## Running the tests

```shell
yarn test
```

## License

MIT