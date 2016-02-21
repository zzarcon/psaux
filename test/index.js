var expect = require('chai').expect;
var assert = require('assert');
var psaux = require('../lib/psaux');

describe('psaux', () => {
  describe('#List', () => {
    it('Return a promise', () => {
      expect(psaux).to.be.a('function');
      expect(psaux()).to.be.an.instanceof(Promise);
    });
  });

  describe('#Filter', () => {
    it('Apply filters on the returned process list', () => {
      expect(psaux).to.be.a('function');
    });
  });
});