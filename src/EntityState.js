import _get from 'lodash/fp/get';
import _set from 'lodash/fp/set';

let EntityState = {};

function setState(state, source, sourcePath) {
  return (source && sourcePath) ?
    _set(sourcePath, state, source)
    :
    state;
}

/**
 * Initialize state
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
    // Initial value, at the time it started changing in this state. For undo features and showing
    // what properties was changed after changes has been submitted.
    pathInitial: {}, // { [path]: initial-value }

    // Timestamp when this state where first initialized
    initializedAt: undefined,
    // Timestamp when this state where last loaded
    loadedAt: undefined,
    // Timestamp when last unstaged change where added to the state
    changedAt: undefined,
    // Error that is relevant for the whole data set
    error: undefined,
    // Errors that apply to a given place in the data structure
    pathError: {},

    // Request-related
    // An operation that will load new data into this state when done is pending
    loading: false,
    // An operation that is updating the remote source of this data is pending
    updating: false,

    // Loading data pending for a given subset of data
    pathLoading: {}, // [path]: true
    // Updating data pending for given subset of data
    padhUpdating: {} // [path]: true
  };

  // return (source && sourcePath) ?
  //   _set(sourcePath, state, source)
  //   :
  //   state;
  return setState(state, source, sourcePath);
};

function getState(source, sourcePath) {
  return (
    (source && sourcePath) ?
      _get(sourcePath, source)
      :
      source
  ) || EntityState.initialize();
}

/**
 * Load data into state
 *
 * @param {object|array} data Data to load
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} New state
 */
EntityState.load = (data, source, sourcePath) => {

  const state = getState(source, sourcePath);

  return setState({
    // ...state,
    ...EntityState.initialize(),
    pathChange: state.pathChange || {},
    data
  }, source, sourcePath);
};

/**
 * Set a new value at the given path in the data
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
 * Stage a new value at a given path of the data in `pathChange`, while keeping the original set in `data`
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

  // const prevState = (source && sourcePath) ? _get(sourcePath, source)
  const prevState = getState(source, sourcePath);

  // const withChange = _set(`pathChange["${path}"]`, value, prevState);

  // return

  const initialValue = _get(`pathInitial["${path}"]`, prevState) || _get(`data.${path}`, prevState);

  const state = _set(`pathInitial["${path}"]`, initialValue,
    _set(`pathChange["${path}"]`, value, prevState)
  );

  return setState(state, source, sourcePath);

  // return setState({
  //   pathInitial: {}
  // }, source, sourcePath);

  // return (source && sourcePath) ?
  //   _set(`${sourcePath}.pathChange["${path}"]`, value, source)
  //   :
  //   _set(`pathChange["${path}"]`, value, source || EntityState.initialize());
};

/**
 * Set an error in the state, that is regarding the whole data set or surrounding processes.
 *
 * @param {object} error Error object
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} New state
 */
EntityState.error = (error, source, sourcePath) => {
  return (source && sourcePath) ?
    _set(`${sourcePath}.error`, error, source)
    :
    _set('error', error, source || EntityState.initialize());
};

/**
 * Set an error for a given path in the state
 *
 * @param {string} path Path to the value inside the state data-set where this error applies
 * @param {object} error Error object
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state should be located
 * @return {object} New state
 */
EntityState.pathError = (path, error, source, sourcePath) => {
  return (source && sourcePath) ?
    _set(`${sourcePath}.pathError["${path}"]`, error, source)
    :
    _set(`pathError["${path}"]`, error, source || EntityState.initialize());
};

/**
 * Clear the state structure, removing both the data and all metadata
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

/**
 * Clean the structure, keeping the data but removing any local change or errors in the metadata
 *
 * @param {object} source Data source containing the state
 * @param {string} sourcePath Path inside source data where state is located
 * @return {object} New state
 */
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

/**
 * Get a copy of the data from a given state object, with the local changes merged in to the structure
 *
 * @param {object} state State containing the relevant data
 * @return {object|array} Data structure
 */
EntityState.dataWithChanges = (state = {}) => {
  const {
    data = {},
    pathChange = {}
  } = state;

  const pathChangeKeys = Object.keys(pathChange)
    .filter(key => pathChange[key] !== undefined);

  // Merge staged changes with original data to form the active data set
  return pathChangeKeys.reduce((data, path) =>
    _set(path, pathChange[path], data)
  , data);
};

export default EntityState;
