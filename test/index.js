var expect = require('chai').expect;
var assert = require('assert');
var psaux = require('../lib/psaux');

describe('psaux', function() {
  describe('#List', function() {
    it('Return a promise', function() {
      expect(psaux).to.be.a('function');
      expect(psaux()).to.be.an.instanceof(Promise);
    });
  });

  describe('#Filter', function() {
    it('Apply filters on the returned process list', () => {
      expect(psaux).to.be.a('function');
    });
  });
});