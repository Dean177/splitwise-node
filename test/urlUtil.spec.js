const chai = require('chai');
const { expect } = chai; 
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
      expect(res).to.equal('abc=value');
    });

    it('Encodes a key value numbers', () => {
      const res = encodeKeyValuePair('abc', 123);
      expect(res).to.equal('abc=123');
    });

    it('Encodes a key value booleans', () => {
      const res = encodeKeyValuePair('abc', false);
      expect(res).to.equal('abc=false');
    });
  });

  describe('encodeAsUrlParam',() => {
    it('converts an object into a url param string', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        key_b: 0,
        key_c: false
      });

      expect(res).to.equal('key_a=val_a&key_b=0&key_c=false');
    });

    it('uri encodes keys and values', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        key_b: 0,
        key_c: false
      });

      expect(res).to.equal('key_a=val_a&key_b=0&key_c=false');
    });

    it('Will skip keys whose value is null or undefined', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        key_b: null,
        key_c: undefined,
        key_d: 'val_d'
      });

      expect(res).to.equal('key_a=val_a&key_d=val_d');
    });

    it('When provided with a key whose value is an array, pass though the values of the arrayarray directly', () => {
      const res = encodeAsUrlParam({
        key_a: 'val_a',
        keyValuePairs: ['key=val', 'abc=123']
      });

      expect(res).to.equal('key_a=val_a&key=val&abc=123');
    });
  });

  describe('encodeObjectArray',() => {
    it('converts an array of object into an array of strings', () => {
      const res = encodeObjectArray('prefix', [
        { obj_a_key_a: 'a', obj_a_key_b: 'b' },
        { obj_b_key_a: 'a' },
        { obj_c_key_c: 'c' }
      ]);

      expect(res).to.eql([
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

      expect(res).to.eql([
        'prefix__0__%23%23%23=%24%24%24',
        'prefix__0__spaced%20key=spaced%20val'
      ]);
    });

    it('Encodes the prefix', () => {
      const res = encodeObjectArray('# $', [{ '# #': '$ $' }]);

      expect(res).to.eql(['%23%20%24__0__%23%20%23=%24%20%24']);
    });

    it('Returns an empty array when given an empty array', () => {
      const res = encodeObjectArray('prefix', []);

      expect(res).to.eql([]);
    });
  });
});
