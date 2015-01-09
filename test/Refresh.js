/* global describe, it */

var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./util').ticker;
var Refresh = require('../lib/Refresh');


describe('Refresh', function () {

  function getScope () {
    return nock('https://www.reddit.com/').get('/comments/test');
  }


  it('should send request at intervals', function (done) {
    var tick, scope, request;

    tick = ticker(3, function () {
      request.stop();
      scope.done();
      done();
    });

    scope = getScope().times(3).reply(200, {});

    request = new Refresh({
      interval: 10,
      url: 'https://www.reddit.com/comments/test'
    });

    request.on('error', expect().fail);
    request.on('response', tick);

    request.fetch();
  });


  it('should emit error on non-200 responses', function (done) {
    var fn, scope, request;

    fn = function (err) {
      expect(err.message).to.match(/^Refresh: request responded with/);
      request.stop();
      scope.done();
      done();
    };

    scope = getScope().reply(500);

    request = new Refresh({
      interval: 10,
      url: 'https://www.reddit.com/comments/test'
    });

    request.on('error', fn);

    request.fetch();
  });


  it('should still refresh on error', function (done) {
    var tick, scope, request;

    tick = ticker(3, function () {
      request.stop();
      scope.done();
      done();
    });

    scope = getScope().times(3).reply(500);

    request = new Refresh({
      interval: 10,
      url: 'https://www.reddit.com/comments/test'
    });

    request.on('error', tick);

    request.fetch();
  });


  it('should stop refresh on error if stopOnFail=true', function (done) {
    var tick, scope, request;

    tick = ticker(2, function () {
      expect(request._active).to.be(false);
      scope.done();
      done();
    });

    scope = getScope()
      .reply(200, {})
      .get('/comments/test')
      .reply(500);

    request = new Refresh({
      interval: 10,
      url: 'https://www.reddit.com/comments/test',
      stopOnFail: true
    });

    request.on('data', tick);
    request.on('error', tick);

    request.fetch();
  });

});
