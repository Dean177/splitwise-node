const chai = require('chai');
const urlUtil = require('./../urlUtil');
const {
  encodeAsUrlParam,
  encodeKeyValuePair,
  encodeObjectArray,
  flatten
} = urlUtil;

describe('urlUtil',() => {
  describe('encodeKeyValuePair', () => {
    it('Encodes a key value pair', () => {
      const res = encodeKeyValuePair('abc', 'value');
    });

    it('Handles strings', () => {
      const res = encodeKeyValuePair('abc', 'value');
    });

    it('Encodes a key value numbers', () => {
      const res = encodeKeyValuePair('abc', 'value');
    });

    it('Encodes a key value booleans', () => {
      const res = encodeKeyValuePair('abc', 'value');
    });
  });

  describe('flatten', () => {
    it('Will flatten arbitrarily nested arrays');
  });

  describe('encodeAsUrlParam',() => {
    it('converts an object into a url param string', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        key_b: 0,
        key_c: false
      });

      chai.expect(res).to.equal('key_a=val_a&key_b=0&key_c=false');
    });

    it('uri encodes keys and values', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        key_b: 0,
        key_c: false
      });

      chai.expect(res).to.equal('key_a=val_a&key_b=0&key_c=false');
    });

    it('Will skip keys whose value is null or undefined', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        key_b: null,
        key_c: undefined,
        key_d: 'val_d'
      });

      chai.expect(res).to.equal('key_a=val_a&key_d=val_d');
    });

    it('throws an error unless given an object with strings|numbers for values');

    it('When provided with a key whose value is an array, pass though the array directly', () => {

    })
  });

  describe('encodeObjectArray',() => {
    it('converts an array of object into an array of strings', () => {
      const res = encodeObjectArray('prefix', [
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
      const res = encodeObjectArray('prefix', [{
        '###': '$$$',
        'spaced key': 'spaced val'
      }]);

      chai.expect(res).to.eql([
        'prefix__0__%23%23%23=%24%24%24',
        'prefix__0__spaced%20key=spaced%20val'
      ]);
    });

    it('Encodes the prefix', () => {
      const res = encodeObjectArray('# $', [{ '# #': '$ $' }]);

      chai.expect(res).to.eql(['prefix__0__%23%23%23=%24%24%24']);
    });

    it('Returns an empty array when given an empty array', () => {
      const res = encodeObjectArray('prefix', []);

      chai.expect(res).to.eql([]);
    });
  });
});
