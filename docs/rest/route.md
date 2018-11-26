# Route

A Route represent an endpoint (for example `/foo`). You can create sub endpoint, add options, etc.

```javascript
const { Route } = require('@guivic/fabric-node');
```

## Summary

- [How it works](#how-it-works?)

- [Configuration](#configuration)

- [Configuration Examples](#configuration-examples)

- [Add a route to a MicroService instance](#add-a-route-to-a-microservice-instance)

## How it works?

First of all, Route is an "abtract" class that you have to extend to create an endpoint:

```javascript
class FooRoute extends Route {
    constructor() {
        super('endpoint', {
            // sub endpoint configuration
        }, {
            // options for the endpoint and sub endpoints
        });
    }

    method(ctx, next) {
        // an endpoint handler
    }
}
```

In the constructor you have to call `super` with a configuration Object.

You will define the base endpoint and all options and subenpoint in this Object.

When it's done, you have to create one method per sub endpoint with the same name defines in the Object.

## Configuration

The base constructor takes 3 parameters:

- `endpoint`: **required** A String that defines the base endpoint (example: '/foo')
- `routes`: **optional** An Object that defines sub endpoints. Default `{}`
- `options`: **optional** An Object that defines options for the endpoint and sub endpoints. Default `{}`

## Configuration examples

### endpoint *`String`*

A String the defines the base endpoint.

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals');
    }
});
```

### routes *`Object`*

An Object that defines sub endpoints with theirs options.

Default: `{}`

You can defines sub endpoints by passing those attributes to the route configuration Object:

| Attributes |         In REST        |             Example             |
| ---------- | ---------------------- | ------------------------------- |
| create     | /animals POST          | [example](#validation-object)   |
| index      | /animals GET           | [example](#validation-object)   |
| get        | /animals/:id GET       | [example](#validation-object)   |
| update     | /animals/:id PUT       | [example](#validation-object)   |
| delete     | /animals/:id DELETE    | [example](#validation-object)   |
| customs    | /animals/:id/feed POST | [example](#isProtected-boolean) |

Each attributes will accept this:
- `validation`: **optional** An Object that contains Joi validation schema (in body / params / query).
- `isProtected`: **optional** A Boolean that activates koa-jwt for the current endpoint (your client will need to send the JWT through the header). Default `false`
- `middlewares`: **optional** An array that contains every middleware that you want to add to the endpoint. Default `[]`
- `koaBodyOptions`: **optional** An Object that let you override the default koa-body options. Usefull if you need to handle upload for example. Default `{}`.

#### validation *`Object`*

An Object that contains Joi validation schema (in body / params / query).

```javascript
const Joi = require('joi');

class AnimalRoute extends Route({
    constructor() {
        super('/animals', {
            create: { // /animals POST
                validation: {
                    body: {
                        name: Joi.string().required(),
                    },
                },
            },
            index: { // /animals?name=lion GET
                validation: {
                    query: {
                        name: Joi.string().optional(),
                    },
                },
            },
            update: { // /animals/:id PUT
                validation: {
                    params: {
                        id: Joi.number().min(0).required(),
                    },
                    body: {
                        name: Joi.string().optional(),
                    },
                }
            },
            delete: { // /animals/:id DELETE
                validation: {
                    params: {
                        id: Joi.number().min(0).required(),
                    },
                }
            },
        }, {
            json: true,
        });
    }

    create(ctx) { // the create handler
        ...
    }

    index(ctx) { // the index handler
        ...
    }

    update(ctx) { // the update handler
        ...
    }
});
```

#### isProtected *`Boolean`*

A Boolean that activates [koa-jwt](https://github.com/koajs/jwt) for the current endpoint (your client will need to send the JWT through the header).

Default: `false`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', {
            create: {
                validation: { ... },
                isProtected: true, // We must call the endpoint with a JWT in the header
            },
            customs: {
                me: {
                    endpoint:    '/me',
                    method:      'GET',
                    isProtected: true,
                },
            },
        }, {
            json: true,
        });
    }

    create(ctx) { // the create handler
        ...
    }

    me(ctx) { // the me handler
        ...
    }
});
```

#### middlewares *`Array`*

An array that contains every middleware that you want to add to the endpoint.

Default: `[]`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', {
            create: {
                validation: { ... },
                middlewares: [ // /animals POST will use this middleware
                    async (ctx, next) => {
                        const start = Date.now();
                        await next();
                        const ms = Date.now() - start;
                        console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
                    },
                ],
            },
        }, {
            json: true,
        });
    }
});
```

#### koaBodyOptions *`Object`*

An Object that let you override the default [koa-body](https://github.com/dlau/koa-body) options.

Usefull if you need to handle upload for example.

Default: `{}`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', {
            create: {
                validation: { ... },
                koaBodyOptions: {
                    multipart: true,
                },
            },
        }, {
            json: true,
        });
    }

    create(ctx) {
        const { files } = ctx.request;

        // files will contain uploaded files.
        // Please read the koa-body documentation for more informations.
    }
});
```

### options *`Object`*

An Object that defines options for the endpoint and sub endpoints.

Default: `{}`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', {}, {
            json: true,
            JWT_SECRET: 'foobar',
        });
    }
});
```

Possible options:

- `json`: **optional** A Boolean that activates [koa-body](https://github.com/dlau/koa-body). Default `false`
- `JWT_SECRET`: **optional** A String that defines the JWT secret key for [koa-jwt](https://github.com/koajs/jwt) to active the requests authentication. Default `null`
- `acl`: **optional** An Object that defines ACL configuration for the API with [casbin](https://github.com/casbin/node-casbin). Default `null`

#### json *`Boolean`*

A Boolean that activates [koa-body](https://github.com/dlau/koa-body).

It will be activated for all sub endpoints (you can override the koaBody configuration for each endpoints).

Default: `false`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', { ... }, {
            json: true,
        });
    }
});
```

#### JWT_SECRET *`String`*

A String that defines the JWT secret key for [koa-jwt](https://github.com/koajs/jwt) to active the requests authentication.

Default: `null`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', { ... }, {
            JWT_SECRET: process.env.JWT_SECRET || 'fooBar',
        });
    }
});
```

#### acl *`Object`*

An Object that defines ACL configuration for the API with [casbin](https://github.com/casbin/node-casbin).

Default: `null`

```javascript
class AnimalRoute extends Route({
    constructor() {
        super('/animals', { ... }, {
            acl:  {
                enforcer: () => Enforcer.newEnforcer(`path/to/model.conf`, `path/to/policy.csv`),
            },
        });
    }
});
```

It will use the default Authorizer. The default Authorizer will get the user role from the user context (filled with koa-jwt) by looking for `ctx.context.user.role` and match it with the `policy.csv`.

It will return a [seven-boom](https://github.com/GiladShoham/seven-boom) error `forbidden`.

But, you can also implements your own Authorizer:

```javascript
class MyAuthorizer {
    _getUserRole(ctx) {
        if (ctx.state && ctx.state.user) {
            return ctx.state.user.role || 'guest';
        }
        return 'guest';
    }

    checkPermission(ctx, enforcer) {
        const { originalUrl: path, method } = ctx;
        const role = this._getUserRole(ctx);
        return enforcer.enforce(role, path, method);
    }

    onError(ctx) {
        ctx.status = 403;
        ctx.body = SevenBoom.forbidden('', {}, 'fobidden');
    }
}
}

class AnimalRoute extends Route({
    constructor() {
        super('/animals', { ... }, {
            acl:  {
                enforcer: () => Enforcer.newEnforcer(`path/to/model.conf`, `path/to/policy.csv`),
                authorizer: new MyAuthorizer(),
            },
        });
    }
});
```

An Authorizer must contains 2 methods:
- `checkPermission`: return true if the user can access the resource
- `onError`: called when checkPermission return false and let you to return a custom status / body to your client.

More informations and documentation in the source (the default Authorizer): https://github.com/guivic/fabric-node/blob/master/src/api/rest/RestAuthorizer.js

## Add a route to a MicroService instance

To add a route, it's simple:
```javascript
const FooRoute = require('./routes/foo.route.js');
const BarRoute = require('./routes/bar.route.js');

const { PORT } = process.env;

const app = new MicroService({
    port: PORT,
});

app.addRoute(new FooRoute()); // Just call the addRoute method with your route instance
app.addRoute(new BarRoute());

app.start().then(() => {
    logger.info(`listening on ${PORT}`);
});
```