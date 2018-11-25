# MicroService

A MicroService is the Koa wrapper. It initialize Koa and define options for your REST API.

```javascript
const { MicroService } = require('@guivic/fabric-node');
```

## Summary

- [Configuration](#configuration)

- [Configuration Examples](#configuration-examples)

- [Add a Route](#add-a-route)

- [Start the app](#start-the-app)

- [How to test with SuperTest ?](#how-to-test-with-supertest-?)

## Configuration

- `port`: **optional** Valid port. Default `3000`.
- `initMethod`: **optional** ASync method that will be exectued before starting the app. Default `() => Promise.resolve();`
- `corsOptions`: **optional** Define the corsOptions for the app. Default `{}`.
- `logger`: **optional** A logger object. `defaultLogger` by default (this preconfigured logger: [winston-lludol](https://github.com/lludol/winston-lludol))
- `datadogConfig`: **optional** [The DataDog configuration Object](https://github.com/topfreegames/koa-datadog-middleware#configuration--customization). Default `{}`.
- `sentryDSN`: **optional** [The Sentry DSN key](https://docs.sentry.io/). Default `null`.
- `requestLogging`: **optional** True if you want the API to log every requests. Default `true`,
- `staticPaths`: **optional** An array with `{ url, path }` to expose folders. `url` is the api path (`/foo`) and path is the relative path to the folder. Default `[]`.

## Configuration Examples

### Port *`Number`*

A valid port. Between 0 and 65535.

Default: `3000`

```javascript
const app = new MicroService({
    port: 3000,
});
```

### initMethod *`Function`*

The ASync method that will be called before starting the app.

```javascript
const app = new MicroService({
    initMethod: async () => {
        const locales = await Locales.load();
        logger.log('Locales loaded');
    },
});
```

### corsOptions *`Object`*

The CORs configuration of the app.
[More informations here.](https://github.com/expressjs/cors#configuration-options)

Default: `{}`

```javascript
const app = new MicroService({
    corsOptions: {
        origin: 'http://example.com',
    },
});
```

### logger *`Object`*

A logger object thant contains logging methods (info, error, warn, debug).

The logger will be available globally as `logger`.

Default: [The winston-lludol logger](https://github.com/lludol/winston-lludol)

```javascript
const app = new MicroService({
    logger: {
        info:  (message) => console.log(message),
        error: (message) => console.log(message),
        warn:  (message) => console.log(message),
        debug: (message) => console.log(message),
    },
});
```

### datadogConfig *`Object`*

[The DataDog configuration Object](https://github.com/topfreegames/koa-datadog-middleware#configuration--customization)

Default: `{}`

```javascript
const app = new MicroService({
    datadogConfig: {
       host:     'my.statsd.host.com',
       port:     8133,
       cacheDns: true
    },
});
```

### sentryDSN *`String`*

[The Sentry DSN key](https://docs.sentry.io/)

Default: `null`

```javascript
const app = new MicroService({
    sentryDSN: 'https://XXXXXX@sentry.io/XXXXXX',
});
```

### requestLogging *`Boolean`*

True if you want the API to log every requests.

Useful to disable logging for testing.

Default `true`

```javascript
const app = new MicroService({
    requestLogging: true,
});
```

### staticPaths *`Array`*

An array with `{ url, path }` to expose folders. `url` is the api path (`/foo`) and path is the relative path to the folder.

Default `[]`

```javascript
const app = new MicroService({
    staticPaths: [
        {
            url:  '/foo',
            path: path.resolve('./foo'),
        },
    ],
});
```

## Add a Route

In most case you will want to add Route to your MicroService.

[More informations about Route here](./route.md).

```javascript
const FooRoute = require('./routes/foo.route.js');

const app = new MicroService({ ... });

app.addRoute(new FooRoute());
```

## Start the app

When you have added all of the routes to your MicroService instance, you can start the app.

It returns the HTTP server created from Koa app.listen.

```javascript
const FooRoute = require('./routes/foo.route.js');
const BarRoute = require('./routes/bar.route.js');

const { PORT } = process.env;

const app = new MicroService({
    port: PORT,
});

app.addRoute(new FooRoute());
app.addRoute(new BarRoute());

app.start().then(() => {
    logger.info(`listening on ${PORT}`);
});
```

## How to test with Supertest ?

Here is an example on how to test your API with `supertest` and `jest`.

```javascript
// index.js
const FooRoute = require('./routes/foo.route.js');

const { PORT, NODE_ENV } = process.env;

const server = new MicroService({
    port: PORT,
});

server.addRoute(new FooRoute());

if (NODE_ENV === 'test') {
    module.exports = server.app; // server.app is the Koa instance
} else {
    server.start().then(() => {
        logger.info(`listening on ${PORT}`);
    });
}
```

```javascript
// foo.test.js
const request = require('supertest');
const server = require('./index.js');

describe('Foo', () => {
    test('/foo', async () => {
        const response = await request(server.callback())
            .post('/foo')
            .send({ name: 'fooBeer' });

        expect(response.status).toEqual(200);
        expect(response.type).toEqual('application/json');
    });
});

```