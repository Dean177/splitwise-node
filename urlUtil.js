function encodeAsUrlParam(object) {
  return Object
    .keys(object)
    .map((key) => {
      const value = object[key];
      // Validate the value is not an 'Object'?
      if (value.constructor == Array) {
        return value; // Hmm, now we have ['abc' [array], 'foo']
      }
      return encodeKeyValuePair(key, value);
    })
    .filter((val) => val != null)
    .join('&');
}

function encodeKeyValuePair(key, value) {
  // Skip keys whose value is null or undefined
  if (value == null) { return null; }
  return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

// TODO, just use underscore or lodash ?
const flatten = (arr) => [].concat.apply([], arr);

function encodeObjectArray(prefix, arr) {
  const encodedPrefix = encodeURIComponent(prefix);

  const nestedArrays = arr.map((obj, index) => {
    return Object.keys(obj).map((key) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(obj[key]);
      // assert the value is a boolean string or number (or date!?) ?
      return `${encodedPrefix}__${index}__${encodedKey}=${encodedValue}`;
    });
  });

  return flatten(nestedArrays);
}

module.exports = {
  encodeAsUrlParam,
  encodeKeyValuePair,
  encodeObjectArray,
  flatten
};