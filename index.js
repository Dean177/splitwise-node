"use strict";
const OAuth = require('oauth').OAuth;
const Promise = require('promise');

function __asUrlParams(object) {
  return Object
    .keys(object)
    .map((key) => {
      // Validate the value is a boolean, string or number?
      // Skip keys whose value is null or undefined
      if (object[key] == null) { return null; }
      return `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`
    })
    .filter((val) => val != null)
    .join('&');
}

function __flattenObjectArray(prefix, arr) {
  const encodedPrefix = encodeURIComponent(prefix);
  const flatten = (arr) => [].concat.apply([], arr);

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

class SplitwiseApi {
  constructor(consumerKey, consumerSecret) {
    this.auth = new OAuth(
      'https://secure.splitwise.com/api/v3.0/get_request_token',
      'https://secure.splitwise.com/api/v3.0/get_access_token',
      consumerKey,
      consumerSecret,
      '1.0',
      null,
      'HMAC-SHA1'
    );
  }

  // OAuth methods
  getOAuthRequestToken() {
    return new Promise((fulfill, reject) => {
      this.auth.getOAuthRequestToken(function (err, oAuthToken, oAuthTokenSecret, results) {
        if (err) reject(err);
        else fulfill({ oAuthToken, oAuthTokenSecret });
      });
    });
  }

  getUserAuthorisationUrl(oAuthToken) {
    return `https://secure.splitwise.com/authorize?oauth_token=${oAuthToken}`
  }

  // TODO seem to be able to use the api
  getOAuthAccessToken(oAuthToken , oAuthTokenSecret, oAuthVerifier) {
    return new Promise((fulfill, reject) => {
      this.auth.getOAuthAccessToken(oAuthToken, oAuthTokenSecret, oAuthVerifier, function (err, oAuthAccessToken, oAuthAccessTokenSecret) {
        if (err) reject(err);
        else fulfill({ oAuthAccessToken, oAuthAccessTokenSecret });
      });
    });
  }

  getUserSpecificApi(oAuthToken, oAuthSecret) {
    return new UserSpecificApi(this.auth, oAuthToken, oAuthSecret);
  }
}

class UserSpecificApi {
  constructor(oAuth, oAuthToken, oAuthTokenSecret) {
    this.auth = oAuth;
    this.oAuthToken = oAuthToken;
    this.oAuthTokenSecret = oAuthTokenSecret;
  }

  __authGet(url) {
    return new Promise((fulfill, reject) => {
      this.auth.get(url, this.oAuthToken, this.oAuthTokenSecret, function (err, data) {
        if (err) reject(err);
        else fulfill(JSON.parse(data));
      });
    });
  }

  __authPost(url, body) {
    const contentType = 'application/json';
    return new Promise((fulfill, reject) => {
      this.auth.post(url, this.oAuthToken, this.oAuthTokenSecret, body, contentType, function (err, data) {
        if (err) reject(err);
        else fulfill(JSON.parse(data));
      });
    });
  }

  __authDelete(url) {
    return new Promise((fulfill, reject) => {
      this.auth.delete(url, this.oAuthToken, this.oAuthTokenSecret, function (err, data) {
        if (err) reject(err);
        else fulfill(JSON.parse(data));
      });
    });
  }

  // Api Methods
  // Returns Array<Currency> { currency_code: 'GBP', unit: '£' }
  getCurrencies() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_currencies')
      .then(data => data['currencies']);
  }

  getCategories() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_categories')
      .then(data => data['categories'][0]);
  }

  parseSentence(sentence, friendId) {
    const paramString = __asUrlParams({
      input: sentence,
      friend_id: friendId
    });

    return this.__authPost(`https://secure.splitwise.com/api/v3.0/parse_sentence?${paramString}`, null);
  }

  // Users
  getCurrentUser() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_current_user');
  }

  getUser(userId) {
    return this.__authGet(`https://secure.splitwise.com/api/v3.0/get_user/${userId}`);
  }

  updateUser(userId, user) {
    // TODO
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/update_user/${userId}`, user);
  }

  // Groups
  getGroups() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_groups')
      .then(data => data['groups']);
  }

  getGroup(groupId) {
    return this.__authGet(`https://secure.splitwise.com/api/v3.0/get_group/${groupId}`)
      .then(data => data['group']);
  }

  createGroup(name, members, groupType, countryCode) {
    const paramString = __asUrlParams({
      name,
      group_type: groupType,
      country_code: countryCode
    });
    return 'https://secure.splitwise.com/api/v3.0/create_group';
  }

  deleteGroup(groupId) {
    return `https://secure.splitwise.com/api/v3.0/delete_group/${groupId}`;
  }

  addUserToGroup(groupId, userId) {
    return 'https://secure.splitwise.com/api/v3.0/add_user_to_group';
  }

  removeUserFromGroup(groupId, userId) {
    return 'https://secure.splitwise.com/api/v3.0/remove_user_from_group';
  }

  // Expenses
  getExpenses() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_expenses')
      .then(data => data['expenses'].filter(expense => expense.deleted_at == null));
  }

  getDeletedExpenses() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_expenses')
      .then(data => data['expenses'].filter(expense => expense.deleted_at != null));
  }

  getExpense(expenseId) {
    // TODO
    return  this.__authGet(`https://secure.splitwise.com/api/v3.0/get_expense/${expenseId}`)
      .then(data => data['expense']);
  }

  // There's a bug in out parameter handling with OAuth. Normally, you would submit an array with some formatting similar to:
  // users[0][user_id]=12&users[0][email]=bears@example.com&user[1][user_id]=7866...
  // but our system doesn't handle brackets properly, so instead you submit array/objects style parameters like:
  // users__0__user_id=12&users__0__email=bears@example.com
  createExpense(expense) {
    // TODO
    return this.__authPost('https://secure.splitwise.com/api/v3.0/create_expense', expense);
  }

  /**
   * @param {Number|String} expenseId
   * @param {Object} expenseUpdate
   * @returns {Promise<Object|Error>}
   */
  updateExpense(expenseId, expenseUpdate) {
    // TODO
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/update_expense/${expenseId}`, expenseUpdate);
  }

  /**
   * @param {Number|String} expenseId
   * @returns {Promise<Boolean|Error>}
   */
  deleteExpense(expenseId) {
    // TODO
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/delete_expense/${expenseId}`, {});
  }

  /**
   * Returns an array of friends // TODO detail friend schema
   * @returns {Promise<Array<Object>|Error>}
   */
  getFriends() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_friends')
      .then(data => data['friends']);
  }

  /**
   * Returns the friend // TODO detail friend schema
   * @returns {Promise<Object|Error>}
   */
  getFriend(friendId) {
    return  this.__authGet(`http://secure.splitwise.com/api/v3.0/get_friend/${friendId}`)
      .then(data => data['friend']);
  }

  createFriend(friend) {
    // TODO
    return this.__authPost('https://secure.splitwise.com/api/v3.0/create_friend', friend);
  }

  createFriends(friends) {
    // TODO
    return this.__authPost('https://secure.splitwise.com/api/v3.0/create_friends', friends);
  }

  deleteFriend(friendId) {
    // TODO
    return this.__authDelete(`https://secure.splitwise.com/api/v3.0/delete_friend/${friendId}`);
  }

  /**
   * Returns an array of notifications
   * @returns {Promise<Array<Object>|Error>}
   */
  getNotifications() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_notifications')
      .then(data => data['notifications']);
  }
}

module.exports = SplitwiseApi;
module.exports.__asUrlParams = __asUrlParams;
module.exports.__flattenObjectArray= __flattenObjectArray;
module.exports.UserSpecificApi = UserSpecificApi;
