"use strict";
const OAuth = require('oauth').OAuth;
const Promise = require("promise").Promise;

function asUrlParams(object) {
  return Object
    .keys(object)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`)
    .join('&');
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

  getOAuthAccessToken(oAuthToken , oAuthTokenSecret, oAuthVerifier) {
    return new Promise((fulfill, reject) => {
      this.auth.getOAuthAccessToken(oAuthToken, oAuthTokenSecret, oAuthVerifier, function (err, oAuthAccessToken, oAuthAccessTokenSecret) {
        if (err) reject(err);
        else fulfill({ oAuthAccessToken, oAuthAccessTokenSecret });
      });
    });
  }

  getUserAuthorisationUrl(oAuthToken) {
    return `https://secure.splitwise.com/authorize?oauth_token=${oAuthToken}`
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
        else fulfill(data);
      });
    });
  }

  __authPost(url, body) {
    const contentType = 'application/json';
    return new Promise((fulfill, reject) => {
      this.auth.post(url, this.oAuthToken, this.oAuthTokenSecret, body, contentType, function (err, data) {
        if (err) reject(err);
        else fulfill(data);
      });
    });
  }

  __authDelete(url) {
    return new Promise((fulfill, reject) => {
      this.auth.delete(url, this.oAuthToken, this.oAuthTokenSecret, function (err, data) {
        if (err) reject(err);
        else fulfill(data);
      });
    });
  }


  // Api Methods
  getCurrencies() {
    // TODO
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_currencies');
  }

  getCategories() {
    // TODO
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_categories');
  }

  parseSentence(sentence) {
    // TODO
    return this.__authPost('https://secure.splitwise.com/api/v3.0/parse_sentence', null);
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
  getGroups() { return 'https://secure.splitwise.com/api/v3.0/get_groups'; }
  getGroup(groupId) { return 'https://secure.splitwise.com/api/v3.0/get_group/:id'; }
  createGroup(group) { return 'https://secure.splitwise.com/api/v3.0/create_group'; }
  deleteGroup(groupId) { return `https://secure.splitwise.com/api/v3.0/delete_group/${groupId}`; }
  addUserToGroup(groupId, userId) { return 'https://secure.splitwise.com/api/v3.0/add_user_to_group'; }
  removeUserFromGroup(groupId, userId) { return 'https://secure.splitwise.com/api/v3.0/remove_user_from_group'; }


  // Expenses
  getExpenses() {
    // TODO
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_expenses');
  }

  getExpense(expenseId) {
    // TODO
    return  this.__authGet(`https://secure.splitwise.com/api/v3.0/get_expense/${expenseId}`);
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

  getFriends() {
    // TODO
    return  this.__authGet('https://secure.splitwise.com/api/v3.0/get_friends');
  }

  getFriend(friendId) {
    // TODO
    return  this.__authGet(`http://secure.splitwise.com/api/v3.0/get_friend/${friendId}`);
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

  getNotifications() {
    // TODO
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_notifications');
  }
}

module.exports = {
  asUrlParams,
  SplitwiseApi,
  UserSpecificApi
};
