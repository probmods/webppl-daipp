'use strict';

var assert = require('assert');
var cache = require('./cache');

function orderedValues(obj) {
  return Object.keys(obj).sort().map(function(key) {
    return obj[key];
  });
}

var splitAddress = cache(function(address) {
  var arr = address.split('_').slice(1).map(function(s) { return '_' + s; });
  assert.ok(arr.join('') === address);
  return arr;
});

module.exports = {
  orderedValues: orderedValues,
  splitAddress: splitAddress
};
