
// import 'whatwg-fetch';

let Http = {};

Http._fetch = (...args) => fetch(...args);

/**
 * Make HTTP Request
 *
 * @param {object} options Request options
 * @return {object} Promise resolved with { statusCode, response, error }
 */
Http.request = async (options = {}) => {
  const {
    baseUrl,
    headers,
    method = 'GET',
    path = '',
    query = {},
    body,
    credentials = 'include',
    contentType = 'application/json',
    cache = 'default',
    redirect = 'follow',
    referrerPolicy = 'client',
    mode = 'cors'
  } = options;

  const url = baseUrl
    .concat(path)
    .concat(Object.keys(query).length > 0 ?
      '?' + Object.keys(query)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&')
      :
      '');

  let fetchHeaders = new Headers();
  if (headers) {
    // for (const name in headers) {
    //   fetchHeaders.append(name, headers[name]);
    // }
    Object
      .keys(headers)
      .forEach(name => fetchHeaders.append(name, headers[name]));
  }
  if (contentType && (!headers || !headers['Content-Type'])) {
    fetchHeaders.append('Content-Type', contentType);
  }

  let res;

  const fetchBody = JSON.stringify(body);

  try {
    // Only fetch inside this try-catch to avoid other (non-request related) errors to be catched outside
    res = await Http._fetch(url, {
      headers: fetchHeaders,
      method,
      credentials,
      cache,
      redirect,
      referrerPolicy,
      mode,
      body: (contentType && contentType.includes('json')) ? fetchBody : body
    });

  } catch (e) {
    let error = new Error('Can\'t connect to url.');
    error.statusCode = undefined;
    error.connectionError = true;
    throw error;
  }

  if (!res) {
    let error = new Error('No result from fetch');
    throw error;
  }

  const responseContentType = res.headers.get('Content-Type');
  const statusCode = res.status;

  const isJson = Boolean(responseContentType && (
    responseContentType.includes('application/json') || responseContentType.includes('application/hal+json')
  ));

  const response = await (isJson ? res.json() : res.text());

  if (statusCode >= 200 && statusCode <= 290) {
    // Success response
    return {
      statusCode,
      response,
      error: undefined
    };

  } else {
    // Error response
    if (isJson) {
      let error = new Error(response.message || res.statusText);
      error.details = response.details;
      error.stack = response.stack;
      error.connectionError = false;
      error.statusCode = statusCode;
      throw error;

    } else {
      let error = new Error(res.statusText || 'Unknown request error');
      error.connectionError = false;
      error.statusCode = statusCode;
      throw error;
    }
  }
};

/**
 * Make GET request
 *
 * @param {string} path URL Path
 * @param {object} query URL Query
 * @param {object} options Request options
 * @return {object} Promise resolved with { statusCode, response, error }
 */
Http.get = (path, query, options = {}) =>
  Http.request({
    ...options,
    method: 'GET',
    path,
    query
  });

/**
 * Make POST request
 *
 * @param {string} path URL Path
 * @param {object} body Request body
 * @param {object} options Request options
 * @return {object} Promise resolved with { statusCode, response, error }
 */
Http.post = (path, body, options = {}) =>
  Http.request({
    ...options,
    method: 'POST',
    path,
    body
  });

/**
 * Make PUT request
 *
 * @param {string} path URL Path
 * @param {object} body Request body
 * @param {object} options Request options
 * @return {object} Promise resolved with { statusCode, response, error }
 */
Http.put = (path, body, options = {}) =>
  Http.request({
    ...options,
    method: 'PUT',
    path,
    body
  });

/**
 * Make PATCH request
 *
 * @param {string} path URL Path
 * @param {object} body Request body
 * @param {object} options Request options
 * @return {object} Promise resolved with { statusCode, response, error }
 */
Http.patch = (path, body, options = {}) =>
  Http.request({
    ...options,
    method: 'PATCH',
    path,
    body
  });

/**
 * Make DELETE request
 *
 * @param {string} path URL Path
 * @param {object} query URL Query
 * @param {object} options Request options
 * @return {object} Promise resolved with { statusCode, response, error }
 */
Http.delete = (path, query, options = {}) =>
  Http.request({
    ...options,
    method: 'DELETE',
    path,
    query
  });

/**
 * Make composed call functions to all methods with the given options merged in
 *
 * @param {object} options Request options
 * @return {object} Function literal
 */
Http.withOptions = (options = {}) => ({
  request: (callOptions = {}) => Http.request({ ...options, ...callOptions }),
  get: (path, query, callOptions = {}) => Http.get(path, query, { ...options, ...callOptions }),
  post: (path, body, callOptions = {}) => Http.post(path, body, { ...options, ...callOptions }),
  put: (path, body, callOptions = {}) => Http.put(path, body, { ...options, ...callOptions }),
  patch: (path, body, callOptions = {}) => Http.patch(path, body, { ...options, ...callOptions }),
  delete: (path, query, callOptions = {}) => Http.delete(path, query, { ...options, ...callOptions })
});

export default Http;
