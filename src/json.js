'use strict';

var fs = require('fs');
var Tensor = T['__Tensor'];

module.exports = function(env) {

  var readJSON = function(s, k, a, fn) {
    return k(s, JSON.parse(fs.readFileSync(fn, 'utf-8')));
  };

  var readDataSetJSON = function(s, k, a, fn) {
    var arr = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    // Helper to avoid performing map over large data sets in WebPPL.
    // This is faster, and uses significantly less memory than the
    // current divide and conquer map implementation. See #174.
    return k(s, arr.map(function(x) {
      return new Tensor([x.length, 1]).fromFlatArray(x);
    }));
  };

  function writeJSON(s, k, a, fn, obj) {
    return k(s, fs.writeFileSync(fn, JSON.stringify(obj)));
  }

  return {
    readJSON: readJSON,
    readDataSetJSON: readDataSetJSON,
    writeJSON: writeJSON
  };

};
