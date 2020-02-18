# Entity State

**Composable meta-logic for JSON-based data**

An application retrieves data from a server or other external source. There is often a need for metadata that describes the circumstances of the data set. Entity State is a structure that seeks to meet the needs of such metadata in a standardized manner so that logic can easily be built to handle retrieval, processing, manipulation and display of such data.

## Installation

```
npm install entity-data
```

## Usage

```
// ES6
import { EntityState, Http } from 'entity-state';

// CommonJS
var EntityState = require('entity-state').EntityState;
var Http = require('entity-state').Http;
```

## The structure

An entity state is an object that contains the data (like an object representing an entity or an array with a list of entities), and the metadata describing it. The object contains the following properties:

Property        | Type                | Description
---             | ---                 | ---
`data`          | *object* or *array* | The data this state describes
`pathChange`    | *object*            | { [path]: value } Local changes to the data. Flat structure with deep path as object keys
`pathInitial`   | *object*            | { [path]: value } The initial value when it was first changed. Can remain after submit to indicate change was made, and making it possible to undo changes.
`initializedAt` | *string*            | Timestamp when this state where first initialized
`loadedAt`      | *string*            | Timestamp when the current version of the state-data was loaded (like last server fetch)
`changedAt`     | *string*            | Timestamp when last local unsynced change where added to the state
`error`         | *object*            | Error object that is relevant for the whole data set
`pathError`     | *object*            | { [path]: Error } Path-specific error messages. Flat structure with deep paths as object keys
`mode`          | *string*            | View mode for the data. Like being edited, deleted or other feature-states
`pathMode`      | *object*            | View mode for given paths. Like editing form for one object from an array, while the rest remain in non-edit view.
`loading`       | *boolean*           | An ongoing operation that will load new data into the state when done
`pathLoading`   | *object*            | { [path]: boolean } Loading data for given subsets of data
`updating`      | *boolean*           | An ongoing operation that wis updating the remote source of the data
`pathUpdating`  | *object*            | { [path]: boolean } Updating data for given subsets of data

**Example**

```
{
  data: {
    id: 12345,
    name: 'Jon Snow',
    allegiances: [
      'House Stark',
      'The Night\s Watch'
    ]
    email: 'jon@winterfell.com'
  },
  pathChange: {
    name: 'Aegon Targaryen',
    allegiances.2: 'House Targaryen',
    email: 'jon@targaryen.org'
  },
  initializedAt: '2019-05-06T13:30:00Z',
  loadedAt: '2019-05-06T13:30:00Z',
  changedAt: '2019-05-06T13:32:14Z',
  pathError: {
    email: { message: 'The correct domain is targaryen.email' }
  }
}
```

## API


### EntityState

To avoid repeated logic for standard operations, the `EntityState` helper functions can be used or composed with local business logic.

#### .initialize(source, sourcePath)

Set the initial structure (with default properties) of a state object

`source` - The source that contains the existing state. Like if the target state is part of a bigger state object.
`sourcePath` - Path inside source where the target state is located.

#### .load(data, source, sourcePath)

Load given data into the state. Like after fetching from a server, or when creating a new object locally for posting to a server later.

`data` - The data to load into the target state object.
`source` - The source that contains the existing state. Like if the target state is part of a bigger state object.
`sourcePath` - Path inside source where the target state is located.

#### .set(path, value, source, sourcePath)

Set a new value at the given path in the data

`path` - Path to where inside the data structure to set the value. Starts at the root of the data, not the whole state object.
`value` - New value to set at given path in the data.
`source` - The source that contains the existing state. Like if the target state is part of a bigger state object.
`sourcePath` - Path inside source where the target state is located.

Example:

```
EntityState.set('foo', 'BAR', { data: { foo: 'FOO!' } })
```

Should return a new state object containing the following:
```
{
  data: {
    foo: 'BAR'
  }
}
```

#### .stage(path, value, source, sourcePath)

Stage a new value at a given path of the data in `pathChange`, while keeping the original set in `data`

`path` - Path to where in the data structure the new value should end up when merged with the original data.
`value` - New value to set at given path in the data.
`source` - The source that contains the existing state. Like if the target state is part of a bigger state object.
`sourcePath` - Path inside source where the target state is located.

Example:

```
EntityState.stage('foo', 'BAR', { data: { foo: 'FOO!' } })
```

Should return a new state object containing the following:
```
{
  data: {
    foo: 'FOO!'
  },
  pathChange: {
    foo: 'BAR'
  }
}
```

#### .error(error, source, sourcePath)

Set an error in the state, that is regarding the whole data set or surrounding processes.

`error` - Error object
`source` - The source that contains the existing state. Like if the target state is part of a bigger state object.
`sourcePath` - Path inside source where the target state is located.

#### .pathError(path, error, source, sourcePath)

Set an error for a given path in the state

`path` - Path to the value in the data structure that the error is regarding.
`error` - Error object
`source` - The source that contains the existing state. Like if the target state is part of a bigger state object.
`sourcePath` - Path inside source where the target state is located.

#### .clear(source, sourcePath)

Clear the state structure, removing both the data and all metadata

Example:

```
EntityData.clear({ user: { data: {} }, 'foo: 'BAR' }, 'user')
```

Should return a new source object containing the following:
```
{
  foo: 'BAR'
}
```

#### .clean(source, sourcePath)

Clean the structure, keeping the data but removing any local change or errors in the metadata

Example:

```
EntityData.clear({
  user: {
    data: {
      name: 'The name'
    },
    pathChange: {
      name: 'New name'
    }
  },
  foo: 'BAR'
}, 'user')
```

Should return a new source object containing the following:
```
{
  user: {
    data: {
      name: 'The name'
    }
  },
  foo: 'BAR'
}
```

#### .dataWithChanges(state)

Get a copy of the data from a given state object, with the local changes merged in to the structure

Example:

```
EntityData.dataWithChanges({
  data: {
    id: 123,
    name: 'Existing name'
  },
  pathChange: {
    name: 'New name'
  }
})
```
Should return a new data object like the following:
```
{
  id: 123,
  name: 'New name'
}
```

### Http

Application state is often received via HTTP Requests. This is a small set of functions wrapping the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for simplified HTTP Requests.

#### .request(options = {})

Make HTTP Request

**Options:**

Property        | Type      | Description
---             | ---       | ---
`baseUrl`       | *string*  | Base url to the root of the target API/resource
`headers`       | *object*  | Headers ({ [name]: contents })
`method`        | *string*  | Request method
`path`          | *string*  | Path (under baseUrl) to the endpoint
`query`         | *object*  | URL query parameters
`body`          | *object*  | Request body
`credentials`   | *string*  | Credential option: `omit`, `same-origin`, or `include` (default)
`contentType`   | *string*  | Shortcut for setting the Content-Type header
`cache`         | *string*  | `no-cache`, `reload`, `force-cache`, `only-if-cached`, `default` (default)
`redirect`      | *string*  | `manual`, `error`, `follow` (default)
`referrerPolicy`| *string*  |  `no-referrer`, `client` (default)
`mode`          | *string*  | `no-cors`, `same-origin`, `cors` (default)
**Examples:**

```
const { response, statusCode } = await Http.request({
  baseUrl: 'http://www.example.com/',
  method: 'GET',
  path: 'users/123'
})
```

```
const { response, statusCode } = await Http.request({
  baseUrl: 'http://www.example.com/',
  method: 'POST',
  path: 'users/',
  body: {
    name: 'New user'
  }
})
```

#### .get(path, query, options = {})

Make GET request

Shortcut for `Http.request({ method: 'GET', path, query, ...options })`

#### .post(path, body, options = {})

Make POST request

Shortcut for `Http.request({ method: 'POST', path, body, ...options })`

#### .put(path, body, options = {})

Make PUT request

#### .patch(path, body, options = {})

Shortcut for `Http.request({ method: 'PUT', path, body, ...options })`

Make PATCH request

#### .delete(path, query, options = {})

Make DELETE request

Shortcut for `Http.request({ method: 'DELETE', path, query, ...options })`

#### .withOptions(options = {})

Make composed call functions to all methods with the given options merged in

**Example:**

```
const {
  get,
  post
} = Http.withOptions({
  baseUrl: 'http://www.example.com/'
})
```

Giving `get`/`post` functions that can be used with relative paths without providing the base url.

---

*__Entity State__ is being actively used, and is in development. Suggestions and contributions are very welcome!*
