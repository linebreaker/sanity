## @sanity/state-router

## Features
Based on a routing schema:
- A state object can be derived from the current pathname
- A state object can be used to generate a path name

## Usage

Define the routes for your application and how they should map to application state
```js
import {route} from '@sanity/state-router'

const router = route('/', [
  route('/products/:productId'),
  route('/users/:userId'),
  route('/:page'),
])

router.encode(route, {})
// => '/'
router.decode(route, '/')
// => {}

router.encode(route, {productId: 54})
// => '/products/54'

router.decode(route, '/products/54')
// => {productId: 54}

router.encode(route, {userId: 22})
// => '/users/22'

router.decode(route, '/users/54')
// => {userId: 54}

router.encode(route, {page: 'about'})
// => '/about'

router.decode(route, '/about')
// => {page: about}

```

## API

- `route(path : string, ?options : Options, ?children : ) : Router`
- `route.scope(name : string, path : string, ?options : Options, ?children : ) : Router`
- `Router`:
  - `encode(state : object) : string`
  - `decode(path : string) : object`
  - `isRoot(path : string) : boolean`
  - `getBasePath() : string`,
  - `isNotFound(pathname: string): boolean`
  - `getRedirectBase(pathname : string) : ?string`

- `RouteChildren`:
  ```
  Router | [Router] | ((state) => Router | [Router])
  ```
- `Options`:
  ```
  {
    path?: string,
    children?: RouteChildren,
    transform?: {[key: string] : Transform<*>},
    scope?: string
  }
  ```

  - `children` can be either another router returned from another `route()-call`, an array of routers or a function that gets passed the matched parameters, and conditionally returns child routes

## Limitations
- Parameterized paths *only*. Each route must have at least one unique parameter. If not, there's no way of unambiguously resolve a path from an empty state.

Consider the following routes:
```js
const router = route('/', [
  route('/about'),
  route('/contact')
])
```

What route should be resolved from an empty state? Since both `/about` and `/contact` above resolves to an empty state object, there's no way to encode an empty state unambiguously back to either of them. The solution to this would be to introduce the page name as a parameter instead:
```js
const router = route('/', route('/:page'))
```

Now, `/about` would resolve to the state `{page: 'about'}` which unambiguously can map back to `/page`, and an empty state can map to `/`. To figure out if you are on the index page, you can check for `state.page == null`, (and set the state.page to null to navigate back to the index)

### No query params
Query parameters doesn't work too well with router scopes as they operate in a global namespace. A possible workaround is to "fake" query params in a path segment using transforms:
```js
function decodeParams(pathsegment) {
  return pathsegment.split(';')
    .reduce((params, pair) => {
      const [key, value] = pair.split('=')
      params[key] = value
      return params
    }, {})
}
function encodeParams(params) {
  return Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join(';')
}

const router = route('/some/:section/:settings', {
  transform: {
    settings: {
      toState: decodeParams,
      toPath: encodeParams
    }
  }
}, route('/other/:page'))
```
This call...
```js
router.decode('/some/bar/width=full;view=details')
```
...will return the following state 
```js
{
  section: 'bar',
  settings: {
    width: 'full',
    view: 'details',
  }
}
```
Conversely calling
```js
router.encode({
  section: 'bar',
  settings: {
    width: 'full',
    view: 'details',
  }
})
```
will return
```
/some/bar/width=full;view=details
```

## Scopes
A scope is a separate router state space, allowing different parts of an application to be completely agnostic about the overall routing schema is like. Let's illustrate:

```js
import {route} from './src'
function findAppByName(name) {
  return name === 'pokemon' && {
    name: 'pokemon',
    router: route('/:section', route('/:pokemonName'))
  }
}

const router = route('/', [
  route('/users/:username'),
  route('/apps/:appName', params => {
    const app = findAppByName(params.appName)
    return app && route.scope(app.name, '/', app.router)
  })
])
```
Decoding the following path...
```js
router.decode('/apps/pokemon/stats/bulbasaur')
```
...will give us the state:
```js
{
  appName: 'pokemon',
  pokemon: {
    section: 'stats',
    pokemonName: 'bulbasaur'
  }
}
```

## 404s

To check whether a path name matches, you can use the isNotFound method on the returned router instance:

```js
const router = route('/pages/:page')

router.isNotFound('/some/invalid/path')
// => true

```

## Base paths

Using a base path is as simple as adding a toplevel route with no params:
```js
const router = route('/some/basepath', [
 route('/:foo'),
 route('/:bar')
])
```
Any empty router state will resolve to `/some/basepath`. To check if you should redirect to the base path on app init, you can use the `router.isRoot(path)` and `router.getBasePath()` method:

```js
if (router.isRoot(location.pathname)) {
  const basePath = router.getBasePath()
  if (basePath !== location.pathname) {
    history.replaceState(null, null, basePath)
  }
}
```

For convenience, this check is combined in the method `router.getRedirectBase()`, that if a redirect is needed, will return the base path, otherwise `null`

```js
const redirectTo = router.getRedirectBase(location.pathname)
if (redirectTo) {
  history.replaceState(null, null, redirectTo)
}
```

## License

MIT-licensed