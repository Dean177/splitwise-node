const chai = require('chai');
const splitwiseApi = require('./index');
const { asUrlParams, SplitwiseApi, UserSpecificApi } = splitwiseApi;

describe('Splitwise Api',() => {
  describe('asUrlParams',() => {
    it('converts an object into a url string');
    it('uri encodes keys and values');
    it('throws an error unless given an object with strings|numbers for values');
  });

  describe('SplitwiseApi',() => {
    it('Accepts a thing and a thing in constructor');
    it('Fetches a request token & secret');
    it('Returns a user authorisationUrl');
    it('Creates an object for dealing with a specific user');
  });

  describe('UserSpecificApi',() => {
    it('Encodes users');
  })
});
