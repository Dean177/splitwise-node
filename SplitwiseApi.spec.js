const chai = require('chai');
const SplitwiseApi = require('./index');
const { __asUrlParams, __flattenObjectArray, UserSpecificApi } = SplitwiseApi;

describe('Splitwise Api',() => {
  describe('__asUrlParams',() => {
    it('converts an object into a url param string', () => {
      const res = __asUrlParams({
        key_a: 'val_a',
        key_b: 0,
        key_c: false
      });

      chai.expect(res).to.equal('key_a=val_a&key_b=0&key_c=false');
    });

    it('uri encodes keys and values', () => {
      const res = __asUrlParams({
        key_a: 'val_a',
        key_b: 0,
        key_c: false
      });

      chai.expect(res).to.equal('key_a=val_a&key_b=0&key_c=false');
    });

    it('Will skip keys whose value is null or undefined', () => {
      const res = __asUrlParams({
        key_a: 'val_a',
        key_b: null,
        key_c: undefined,
        key_d: 'val_d'
      });

      chai.expect(res).to.equal('key_a=val_a&key_d=val_d');
    });

    it('throws an error unless given an object with strings|numbers for values');
  });

  describe('__flattenObjectArray',() => {
    it('converts an array of object into an array of strings', () => {
      const res = __flattenObjectArray('prefix', [
        { obj_a_key_a: 'a', obj_a_key_b: 'b' },
        { obj_b_key_a: 'a' },
        { obj_c_key_c: 'c' }
      ]);

      chai.expect(res).to.eql([
        'prefix__0__obj_a_key_a=a',
        'prefix__0__obj_a_key_b=b',
        'prefix__1__obj_b_key_a=a',
        'prefix__2__obj_c_key_c=c'
      ]);
    });

    it('Encodes the keys and values', () => {
      const res = __flattenObjectArray('prefix', [{
        '###': '$$$',
        'spaced key': 'spaced val'
      }]);

      chai.expect(res).to.eql([
        'prefix__0__%23%23%23=%24%24%24',
        'prefix__0__spaced%20key=spaced%20val'
      ]);
    });
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
