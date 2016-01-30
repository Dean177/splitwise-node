const flatten = require('lodash.flatten');

function encodeAsUrlParam(object) {
  const keyValuePairs =  Object
    .keys(object)
    .filter((key) => object[key] != null)
    .map((key) => {
      const value = object[key];

      if (value.constructor == Array) {
        return value;
      }

      return encodeKeyValuePair(key, value);
    });


  return flatten(keyValuePairs).join('&');
}

function encodeKeyValuePair(key, value) {
  // Skip keys whose value is null or undefined
  if (value == null) { return null; }
  return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

/**
 * Takes an array of objects and returns an array of strings using the following format
 * `${prefix}__${arrayIndex}__${keyName}={value}`
 *
 * @param {string} prefix
 * @param {Array<Object>} arr
 * @returns {Array<String>}
 */
function encodeObjectArray(prefix, arr) {
  const encodedPrefix = encodeURIComponent(prefix);

  const nestedArrays = arr.map((obj, index) => {
    return Object.keys(obj).map((key) => {
      const value = obj[key];
      return `${encodedPrefix}__${index}__${encodeKeyValuePair(key, value)}`;
    });
  });

  return flatten(nestedArrays);
}

module.exports = {
  encodeAsUrlParam,
  encodeKeyValuePair,
  encodeObjectArray
};
