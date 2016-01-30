"use strict";
const OAuth = require('oauth').OAuth;
const Promise = require('promise');
const util = require('./util');
const { objectHasInvalidKeys } = util;
const urlUtil = require('./urlUtil');
const { encodeAsUrlParam, encodeObjectArray } = urlUtil;


const validExpenseKeys = ['group_id', 'friendship_id', 'dated_after', 'dated_before', 'updated_after', 'updated_before', 'limit', 'offset'];
const requiredFriendKeys = ['user_email', 'user_first_name'];
const optionalFriendKeys = ['user_last_name'];

const friendHasValidKeys = objectHasInvalidKeys.bind(null, requiredFriendKeys.concat(optionalFriendKeys));

class AuthApi {
  constructor(consumerKey, consumerSecret) {
    this.__auth = new OAuth(
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
  /**
   * Fetch a request token to be authorized by a user.
   *
   * TokenSecret: {
   *   token: string,
   *   secret: string,
   * }
   *
   * @returns {Promise<Error|TokenSecret>}
   */
  getOAuthRequestToken() {
    return new Promise((fulfill, reject) => {
      this.__auth.getOAuthRequestToken(function (err, oAuthToken, oAuthTokenSecret, results) {
        if (err) reject(err);
        else fulfill({ token: oAuthToken, secret: oAuthTokenSecret });
      });
    });
  }

  getUserAuthorisationUrl(oAuthToken) {
    return `https://secure.splitwise.com/authorize?oauth_token=${oAuthToken}`
  }

  // TODO seem to be able to use the api without needing to exchange the request token for an access token
  getOAuthAccessToken(oAuthToken , oAuthTokenSecret, oAuthVerifier) {
    return new Promise((fulfill, reject) => {
      this.__auth.getOAuthAccessToken(oAuthToken, oAuthTokenSecret, oAuthVerifier, function (err, oAuthAccessToken, oAuthAccessTokenSecret) {
        if (err) reject(err);
        else fulfill({ oAuthAccessToken, oAuthAccessTokenSecret });
      });
    });
  }

  getSplitwiseApi(oAuthToken, oAuthSecret) {
    return new SplitwiseApi(this, oAuthToken, oAuthSecret);
  }
}

class SplitwiseApi {
  constructor(authApi, oAuthToken, oAuthTokenSecret) {
    this.__auth = authApi.__auth;
    this.oAuthToken = oAuthToken;
    this.oAuthTokenSecret = oAuthTokenSecret;
  }

  __parseResponse(reject, fulfill, err, data) {
    if (err) {
      reject({
        statusCode: err.statusCode,
        error: JSON.parse(err.data).error
      });
    } else {
      fulfill(JSON.parse(data));
    }
  }

  __authGet(url) {
    return new Promise((fulfill, reject) => {
      this.__auth.get(url, this.oAuthToken, this.oAuthTokenSecret, this.__parseResponse.bind(this, reject, fulfill));
    });
  }

  __authPost(url, body) {
    const contentType = 'application/json';
    return new Promise((fulfill, reject) => {
      this.__auth.post(
        url,
        this.oAuthToken,
        this.oAuthTokenSecret,
        body,
        contentType,
        this.__parseResponse.bind(this, reject, fulfill)
      );
    });
  }

  __authPut(url, body) {
    const contentType = 'application/json';
    return new Promise((fulfill, reject) => {
      this.__auth.put(
        url,
        this.oAuthToken,
        this.oAuthTokenSecret,
        body,
        contentType,
        this.__parseResponse.bind(this, reject, fulfill)
      );
    });
  }

  __authDelete(url) {
    return new Promise((fulfill, reject) => {
      this.__auth.delete(
        url,
        this.oAuthToken,
        this.oAuthTokenSecret,
        this.__parseResponse.bind(this, reject, fulfill)
      );
    });
  }

  // Api Methods
  /**
   * A service health-check
   *
   * @returns {Promise<boolean>}
   */
  isServiceOk() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/test')
      .then(() => { return true; })
      .catch(() => { return false; });
  }

  /**
   * Returns a list of all currencies allowed by the system
   * Currency: { currency_code: 'GBP', unit: '£' }
   *
   * @returns {Promise<Error|Array>}
   */
  getCurrencies() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_currencies')
      .then(data => data['currencies']);
  }

  /**
   * Return an array of all categories
   * Category: {
   *   id: Number
   *   name: String
   *   icon: String // TODO dimensions
   *   icon_types: {
   *    slim: {
   *      small: String,
   *      large: String
   *    }
   *   },
   *   subcategories: Array<Category>
   * }
   *
   * @returns {Promise<Error|Array>}
   */
  getCategories() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_categories')
      .then(data => data['categories']);
  }

  /**
   * Return a suggested expense for a natural language sentence
   * ExpenseSuggestion: {
   *   expense: Expense,
   *   valid: Boolean,
   *   confidence: Number
   * }
   *
   * @param {String} sentence
   * @param {Number} friendId
   * @param {Boolean} [autosave]
   * @returns {Promise<Error|ExpenseSuggestion>}
   */
  parseSentence(sentence, friendId, autosave) {
    const paramString = encodeAsUrlParam({
      input: sentence,
      friend_id: friendId,
      autosave: autosave || undefined
    });

    return this.__authPost(`https://secure.splitwise.com/api/v3.0/parse_sentence?${paramString}`, null);
  }

  // Users
  /**
   * Returns the current user
   *
   * User: {
   *   id: Number,
   *   first_name: String,
   *   last_name: String,
   *   picture: {
   *     small: String,
   *     medium: String,
   *     large: String
   *   },
   *   email: String,
   *   registration_status: String, // One if “dummy”, “invited”, and “confirmed”.
   *   force_refresh_at: null,
   *   locale: null,
   *   country_code: 'GB',
   *   date_format: 'MM/DD/YYYY',
   *   default_currency: 'GBP',
   *   default_group_id: -1,
   *   notifications_read: '2015-12-24T13:44:37Z',
   *   notifications_count: 0,
   *   notifications: {
   *     added_as_friend: false,
   *     added_to_group: true,
   *     expense_added: false,
   *     expense_updated: false,
   *     bills: true,
   *     payments: true,
   *     monthly_summary: true,
   *     announcements: true
   *   }
   * }
   *
   * @returns {Promise<Error|User>}
   */
  getCurrentUser() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_current_user')
      .then(data => data.user);
  }

  /**
   * Returns the user with the provided id
   * See getFriend
   *
   * @param {Number} userId
   * @returns {Promise<Error|User>}
   */
  getUser(userId) {
    return this.__authGet(`https://secure.splitwise.com/api/v3.0/get_user/${userId}`);
  }

  /**
   * Update user information for the given user. A user can edit anything about himself,
   * and (first_name, last_name, email) for users whom he is acquainted with but haven’t logged in yet.
   *
   * @param {Number} userId
   * @param {Object} user
   * @returns {Promise<Error|user>} - The detailed updated user
   */
  updateUser(userId, user) {
    const validUserKeys = ['first_name', 'last_name', 'email', 'password', 'locale', 'date_format', 'default_currency', 'default_group_id'];
    // TODO figure out how to update notification settings
    const validNotificationSettings = ['notification_settings', 'added_as_friend', 'added_to_group', 'expense_added', 'expense_updated', 'bills', 'payments', 'monthly_summary', 'announcements'];

    const invalidKeysError = objectHasInvalidKeys(validUserKeys, user);
    if (invalidKeysError) {
      return Promise.reject(invalidKeysError);
    }

    const paramString = encodeAsUrlParam(user);
    return this.__authPut(`https://secure.splitwise.com/api/v3.0/update_user/${userId}?${paramString}`, null)
      .then(data => data['user']);
  }

  // Groups
  /**
   * Returns list of all groups that the current_user belongs to
   *
   * @returns {Promise<Error|Array>} - Detailed info for all groups that include the authenticated user
   */
  getGroups() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_groups')
      .then(data => data['groups']);
  }

  /**
   * Get detailed info on one group that current_user belongs to
   *
   * Debt: {
   *   from: Number, // A user id
   *   to: Number, // A user id
   *   amount: String, // eg '24.98'
   *   currency_code: String // See getCurrencies
   * }
   *
   * Group: {
   *   id: 0,
   *   name: 'Non-group expenses',
   *   updated_at: '2015-12-24T14:04:44Z',
   *   members: Array<UserBasic>,
   *   simplify_by_default: false,
   *   original_debts: Array<Debt>
   *   simplified_debts: Array<Debt
   * }
   *
   * @param {Number} groupId
   * @returns {Promise<Error|Array>}
   */
  getGroup(groupId) {
    return this.__authGet(`https://secure.splitwise.com/api/v3.0/get_group/${groupId}`)
      .then(data => data['group']);
  }

  /**
   * Create a new group. Adds the current user to the group by default.
   *
   * Successful response: {
   *   id: Number,
   *   name: String,
   *   updated_at: '2015-12-27T12:49:56Z',
   *   members: [Member, Member],
   *   simplify_by_default: Boolean,
   *   original_debts: Array,
   *   simplified_debts: Array,
   *   whiteboard: null,
   *   group_type: String,
   *   invite_link: String
   * }
   *
   * In the event of an error, an 'Errors' object will be returned. Eg:
   * Failure response: {
   *   statusCode: Number,
   *   errors: {
   *     'someParamName': Array<String>
   *   }
   * }
   * Where someParamName represents on of the API parameter's names
   *
   * @param {String} name
   * @param {Array<Object>} members - member:  {first_name, last_name, email } or  { user_id }
   * @param {String} [groupType]
   * @param {String} [countryCode]
   * @returns {Promise<Object|Object>}
   */
  createGroup(name, members, groupType, countryCode) {
    if (!name || name == '') {
      return Promise.reject({ statusCode: 400, errors: { name: ["can't be blank"] } })
    }
    const paramString = encodeAsUrlParam({
      name,
      group_type: groupType,
      country_code: countryCode,
      members: encodeObjectArray('users', members)
    });

    return this.__authPost(`https://secure.splitwise.com/api/v3.0/create_group?${paramString}`, null)
      .then(data => {
        if (data.group.errors) {
          return Promise.reject({ statusCode: 400, errors: data.group.errors });
        }
        return data.group;
      });
  }

  /**
   * @param {String} groupId
   * @returns {Promise<Error|Boolean>} - success
   */
  deleteGroup(groupId) {
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/delete_group/${groupId}`)
      .then(data => (data['success']));
  }

  /**
   * Add a user to the group
   // TODO according to the docs this can return an error on two different ways, e.g
   * fail1: { statusCode: 404, error: 'Invalid API Request: record not found' }
   * fail2: { errors: [ ??? ] }
   * Need a way to normalise these into a single error format
   *
   * Provide either a userId: number or a user: { first_name, last_name, email }
   * @param {Number} groupId
   * @param {Number|Object} [user|userId]
   * @returns {Promise<Error|User>} - Returns either the user which has been added to the group, or an object with an array of errors, or an object with a single error
   */
  addUserToGroup(groupId, user) {
    let paramString;
    if (typeof user === 'number') {
      paramString = encodeAsUrlParam({ group_id: groupId, user_id: user })
    } else {
      const { first_name, last_name, email } = user;
      paramString = encodeAsUrlParam({ group_id: groupId, first_name, last_name, email });
    }
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/add_user_to_group?${paramString}`, null)
      .then(data => {
        if (! data.success) { return Promise.reject({ errors: data.errors }); }
        return data.user;
      });
  }


  /**
   * Remove a user from a group, Only if their balance is 0
   *
   * TODO can return an error in two different ways, need to normalise
   *
   * @param {Number} groupId
   * @param {Number} userId
   * @returns {Promise<Boolean|Error>} - Returns either a boolean to indicate success, or an object with an errors key which contains an array of strings
   */
  removeUserFromGroup(groupId, userId) {
    const paramString = encodeAsUrlParam({ group_id: groupId, user_id: userId });
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/remove_user_from_group?${paramString}`, null)
      .then((data) => {
        if (! data.success) { return Promise.reject({ errors: data.errors }); }
        return true;
      });
  }

  // Expenses
  /**
   * Return expenses involving the current user, in reverse chronological order
   * ExpensesConfig: {
   *   group_id: Number
   *   friendship_id: Number
   *   dated_after
   *   dated_before
   *   updated_after
   *   updated_before
   *   limit: Number (defaults to 20; set to 0 to fetch all)
   *   offset:Number
   * }
   *
   * // TODO this what the api really returns, the docs aren't up to date
   * Expense: {
   *   id: Number
   *   group_id: Number
   *   friendship_id: Number
   *   expense_bundle_id: Number
   *   description: String
   *   details:String
   *   payment,
   *   repeats: Boolean,
   *   repeat_interval: String // 'never',
   *   cost: String, // '25.0'
   *   date: '2015-12-24T13:31:35Z',
   *   created_at: '2015-12-24T13:32:41Z',
   *   created_by: UserBasic
   *   updated_at: '2015-12-24T13:44:06Z',
   *   updated_by: UserBasic
   *   deleted_at: '2015-12-24T13:44:06Z',
   *   deleted_by: UserBasic,
   *   category: {
   *     id: Number,
   *     name: String
   *   },
   * // The following are not detailed in the api docs
   *  email_reminder: Boolean,
   *  email_reminder_in_advance: Number,
   *  next_repeat: null,
   *  details: null,
   *  comments_count: 2,
   *  payment: false,
   *  creation_method: 'equal',
   *  transaction_method: 'offline',
   *  transaction_confirmed: false,
   *  currency_code: 'GBP',
   *  repayments: [ { from: 3089683, to: 1388992, amount: '25.0' } ],
   *  receipt: { large: null, original: null },
   *  users: [
   *    {
   *      user: UserBasic,
   *      user_id: Number,
   *      paid_share: '0.0',
   *      owed_share: '25.0',
   *     net_balance: '-25.0'
   *    },
   *  ],
   *  comments: [
   *    {
   *      id: Number,
   *      content: 'Pay fast',
   *      comment_type: 'User',
   *      relation_type: 'ExpenseComment',
   *      relation_id: 68735153,
   *      created_at: '2015-12-24T13:43:32Z',
   *      deleted_at: null,
   *      user: [Object]
   *    },
   *  ]
   * }
   *
   * @param {Object} [expensesConfig]
   * @returns {Promise<Error|Array<Expense>>}
   */
  getExpenses(expensesConfig) {
    const baseUrl = 'https://secure.splitwise.com/api/v3.0/get_expenses';
    let requestUrl = baseUrl;
    if (expensesConfig) {
      const invalidKeysError = objectHasInvalidKeys(validExpenseKeys, expensesConfig);
      if (invalidKeysError) { return Promise.reject(invalidKeysError); }
      requestUrl = `${baseUrl}?${encodeAsUrlParam(expensesConfig)}`;
    }

    return this.__authGet(requestUrl)
      .then(data => data['expenses'].filter(expense => expense['deleted_at'] == null));
  }

  /**
   * Returns expenses which have been deleted involving the user. Api is the same as for getExpenses
   * @param {Object} [expensesConfig]
   * @returns {Promise<Error|Array<Expense>>}
   */
  getDeletedExpenses(expensesConfig) {
    const baseUrl = 'https://secure.splitwise.com/api/v3.0/get_expenses';
    let requestUrl = baseUrl;
    if (expensesConfig) {
      const invalidKeysError = objectHasInvalidKeys(this.validExpenseKeys, expensesConfig);
      if (invalidKeysError) { return Promise.reject(invalidKeysError); }
      requestUrl = `${baseUrl}?${encodeAsUrlParam(expensesConfig)}`;
    }
    return this.__authGet(requestUrl)
      .then(data => data['expenses'].filter(expense => expense['deleted_at'] != null));
  }

  /**
   * Return full details on an expense involving the current user
   * @param {Number} expenseId
   * @returns {Promise<Error|Expense>}
   */
  getExpense(expenseId) {
    return this.__authGet(`https://secure.splitwise.com/api/v3.0/get_expense/${expenseId}`)
      .then(data => data['expense']);
  }

  /**
   * Add an expense
   * TODO explain the structure of these errors & params
   * ErrorObj: {
   *   base: [
   *     'The total of everyone\'s owed shares ($5.00) is different than the total cost ($9.99)',
   *     'The total of everyone\'s paid shares ($0.00) is different than the total cost ($9.99)',
   *     'You cannot add an expense that does not involve yourself, unless that expense is in a group.'
   *   ],
   *   description: [ 'can\'t be blank' ]
   * }
   *
   * @param {Object} expense
   * @param {Array<UserShare>} userShares
   * @returns {Promise<ErrorObj|Array<Expense>>} - Returns an array containing the expense which has just been created or an object with an errors key
   */
  createExpense(expense, userShares) {
    // TODO validate expense keys
    const requiredExpenseFields = ['payment', 'cost', 'description'];
    const optionalFields = [
      'group_id',
      'friendship_id',
      'details',
      'creation_method', // iou, quickadd, payment, or split
      'date',
      'repeat_interval', // never, weekly, fortnightly, monthly, yearly
      'currency_code',
      'category_id'
    ];

    // TODO validate the userShare keys
    const userShareKeys = ['user_id', 'paid_share', 'owed_share'];

    // TODO validate the total of the userShares

    const paramString = encodeAsUrlParam(Object.assign(
      {},
      expense,
      { users: encodeObjectArray('users', userShares) }
    ));
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/create_expense?${paramString}`, expense)
      .then(data => {
        if (data.errors && Object.keys(data.errors).length != 0) {
          return Promise.reject(data.errors);
        }

        return data['expenses'];
      });
  }

  // TODO create a method which makes it simpler to create an expense between two users

  /**
   * Edit an expense
   * Returns an array containing the expense which has been created
   *
   * @param {Number} expenseId
   * @param {Object} expenseUpdate
   * @returns {Promise<ErrorObj|Array<Expense>>}
   */
  updateExpense(expenseId, expenseUpdate) {
    // TODO validate the keys on expenseUpdate
    const expenseUpdateFields = [
      'group_id',
      'friendship_id',
      'expense_bundle_id', // (TODO the docs give no indication of what this is for)
      'description',
      'details',
      'payment',
      'cost',
      'date',
      'category_id',
      'users' // TODO figure out how nested params work as
    ];

    const userShareUpdate = [
      'user_id',
      'paid_share',
      'owed_share'
    ];

    const paramString = encodeAsUrlParam(expenseUpdate);

    return this.__authPost(`https://secure.splitwise.com/api/v3.0/update_expense/${expenseId}?${paramString}`, null)
      .then(data => {
        if (data.errors && Object.keys(data.errors).length > 0) {
          return Promise.reject(data.errors);
        }

        return data['expenses'];
      });
  }

  /**
   * Delete an expense
   *
   * @param {Number} expenseId
   * @returns {Promise<ErrorObj|Boolean>}
   */
  deleteExpense(expenseId) {
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/delete_expense/${expenseId}`)
      .then(data => {
        if (data.errors && Object.keys(data.errors).length > 0) {
          return Promise.reject(data.errors);
        }

        return data.success;
      });
  }

  // Friends

  /**
   * Returns an array of users
   *
   * User: {
   *   id: Number,
   *   first_name: String,
   *   last_name: [String],
   *   email: String,
   *   registration_status: String, // One if “dummy”, “invited”, and “confirmed”.
   *   picture: {
   *     small: String, // 50px by 50px
   *     medium: String, // 100px by 100px
   *     large: String // 200px by 200px
   *   },
   *   balance: [ currency_code, amount ], // An array with two elements, in element 0 a three character currency code (see getCurrencies) and in element 1 the amount, as a String
   *   groups: Array<Group>,
   *   updated_at: '2015-12-27T22:30:52Z'
   * }
   *
   * @returns {Promise<Error|Array<User>>}
   */
  getFriends() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_friends')
      .then(data => data['friends']);
  }

  /**
   * Given a user id, returns the “friend” object of the user
   * @returns {Promise<Error|User>}
   */
  getFriend(friendId) {
    return  this.__authGet(`http://secure.splitwise.com/api/v3.0/get_friend/${friendId}`)
      .then(data => data['friend']);
  }

  /**
   * Makes the current user a friend of a user specified with the url parameters
   * user_email, user_first_name, and, optionally, user_last_name.
   *
   * @param {Object} friend
   * @returns {Promise<Error|User>}
   */
  createFriend(friend) {
    const keyValidationError = friendHasValidKeys(friend);
    if (keyValidationError) { return Promise.reject(keyValidationError); }
    const urlParams = encodeAsUrlParam(friend);
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/create_friend?${urlParams}`, friend)
      .then((data) => data['friends']);
  }

  /**
   * Make the current user a friend of the specified users. Specify a user with the parameters
   * user_email, user_first_name, and, optionally, user_last_name
   *
   * @param {Array<Object>} friends
   * @returns {Promise<Error|Array<User>>}
   */
  createFriends(friends) {
    friends.forEach(friend => {
      const keyValidationError = friendHasValidKeys(friend);
      if (keyValidationError) {
        return Promise.reject(keyValidationError);
      }
    });

    const urlParams = encodeObjectArray('friends', friends).join('&');
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/create_friends?${urlParams}`).then(data => {
      return data['friends'];
    });
  }

  /**
   * Given a friend ID, break off the friendship between the current user and the specified user.
   *
   * @param friendId
   * @returns {Promise<Error|Boolean>}
   */
  deleteFriend(friendId) {
    return this.__authPost(`https://secure.splitwise.com/api/v3.0/delete_friend/${friendId}`)
      .then(data => data['success']);
  }

  /**
   * Returns an array of notifications
   * @returns {Promise<Error|Array<Object>>}
   */
  getNotifications() {
    return this.__authGet('https://secure.splitwise.com/api/v3.0/get_notifications')
      .then(data => data['notifications']);
  }
}

module.exports = AuthApi;
