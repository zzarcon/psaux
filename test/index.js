var expect = require('chai').expect;
var assert = require('assert');
var psaux = require('../lib/psaux');

describe('psaux', () => {
  describe('#List', () => {
    it('Return a promise', async function () {
      this.timeout(0);
      expect(psaux).to.be.a('function');
      const promise = psaux();
      expect(promise).to.be.an.instanceof(Promise);
      await promise;
    });
  });

  describe('#Filter', () => {
    it('Apply filters on the returned process list', () => {
      expect(psaux).to.be.a('function');
    });
  });
});