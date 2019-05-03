import _get from 'lodash/fp/get';
import _set from 'lodash/fp/set';




let EntityState = {};

/**
 * EntityState.initialize()
 * EntityState.initialize('activeUser', source)
 *
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} State or new source that includes state
 */
EntityState.initialize = (source, sourcePath) => {
  const state = {
    // The data this state is for
    data: undefined,
    // Unstaged changes to the data (like before sending to a server)
    pathChange: {}, // { [path]: changed-value }
    // Timestamp when this state where first initialized
    initializedAt: undefined,
    // Timestamp when this state where last loaded
    loadedAt: undefined,
    // Timestamp when last unstaged change where added to the state
    changedAt: undefined,
    // Error that is relevant for the whole data set
    error: undefined,
    // Errors that apply to a given place in the data structure
    pathError: {}
  };

  return (source && sourcePath) ?
    _set(sourcePath, state, source)
    :
    state;
};

/**
 * EntityState.load(user)
 * EntityState.load(user, state)
 * EntityState.load(user, state, 'activeUser')
 *
 * @param {object|array} data Data to load
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} New state
 */
EntityState.load = (data, source, sourcePath) => {
  return (source && sourcePath) ?
    _set(sourcePath, {
      ...EntityState.initialize(),
      pathChange: _get(`${sourcePath}.pathChange`, source) || {},
      data
    }, source)
    :
    {
      ...EntityState.initialize(),
      pathChange: _get('pathChange', source) || {},
      data
    };
};

/**
 * EntityState.set('foo', bar)
 * EntityState.set('foo', bar, state)
 * EntityState.set('foo', bar, state, 'activeUser')
 *
 * @param {string} path Path to where inside the data-set to set the new value
 * @param {object|array} value Value to set at (path) in data-set
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} New state
 */
EntityState.set = (path, value, source, sourcePath) => {
  if ((typeof path !== 'string') || path.length === 0) {
    throw new Error('EntityState.set - path is invalid: ' + path);
  }
  if (source !== undefined && (typeof source) !== 'object') {
    throw new Error('EntityState.set - source must be an object or array');
  }

  return (source && sourcePath) ?
    _set(`${sourcePath}.data.${path}`, value, source)
    :
    _set(`data.${path}`, value, source || EntityState.initialize());
};

/**
 * EntityState.stage('foo', bar)
 * EntityState.stage('foo', bar, state)
 * EntityState.stage('foo', bar, state, 'activeUser')
 *
 * (Alt names: Prepare, Present, Suggest, Draft, Shape)
 *
 * @param {string} path Path to where inside the state data-set to stage the new value
 * @param {object|array} value Value to set at (path) in the state data-set
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} New state
 */
EntityState.stage = (path, value, source, sourcePath) => {
  // if ((typeof path !== 'string') || path.length === 0) {
  //   throw new Error('EntityState.set - path is invalid: ' + path);
  // }
  // if (source !== undefined && (typeof source) !== 'object') {
  //   throw new Error('EntityState.set - source must be an object or array');
  // }

  return (source && sourcePath) ?
    _set(`${sourcePath}.pathChange["${path}"]`, value, source)
    :
    _set(`pathChange["${path}"]`, value, source || EntityState.initialize());
};

EntityState.error = (error, source, sourcePath) => {
  return (source && sourcePath) ?
    _set(`${sourcePath}.error`, error, source)
    :
    _set('error', error, source || EntityState.initialize());
};

EntityState.pathError = (path, error, source, sourcePath) => {
  return (source && sourcePath) ?
    _set(`${sourcePath}.pathError["${path}"]`, error, source)
    :
    _set(`pathError["${path}"]`, error, source || EntityState.initialize());
};

/**
 * EntityState.clear()
 * EntityState.clear(state, 'activeUser')
 *
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state is located
 * @return {object} New state
 */
EntityState.clear = (source, sourcePath) => {
  return (source && sourcePath) ?
    _set(sourcePath, undefined, source)
    :
    undefined;
};


EntityState.clean = (source, sourcePath) => {
  return (source && sourcePath) ?
    _set(sourcePath, {
      ...(_get(sourcePath, source) || {}),
      pathChange: {},
      pathError: {}
    }, source)
    :
    {
      ...(source || {}),
      pathChange: {},
      pathError: {}
    };
};

EntityState.dataWithChanges = (state = {}) => {
  const { data = {}, pathChange = {} } = state;

  // Merge staged changes with original data to form the active data set
  // return Object.keys(pathChange).reduce((data, path) => ({
  //   ...data,
  //   [path]: pathChange[path]
  // }), data);

  return Object.keys(pathChange).reduce((data, path) =>
    _set(path, pathChange[path], data)
  , data);

};


export default EntityState;
