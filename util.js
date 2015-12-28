/**
 * Verifies that all of the keys of obj are in arr
 * @param {Array<String>} arr
 * @param {Object} obj
 * @returns {Error|Boolean} - returns either an error ( { error: 'message' } ) or false
 */
function objectHasInvalidKeys(arr, obj) {
  Object.keys(obj).forEach((key) => {
    if (arr.indexOf(key) === -1) {
      return { error: `object: ${obj} contained invalid key: ${key}, keys must be one of ${arr}.` };
    }
  });

  return false;
}

module.exports = {
  objectHasInvalidKeys
};
