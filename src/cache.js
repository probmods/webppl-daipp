var LRU = require('lru-cache');

//TODO: should this be in utils?
function cache(f, maxSize) {
  var c = LRU(maxSize);
  var cf = function() {
    var args = Array.prototype.slice.call(arguments);
    var stringedArgs = util.serialize(args);
    if (c.has(stringedArgs)) {
      return c.get(stringedArgs);
    } else {
      //TODO: check for recursion, cache size, etc?
      var r = f.apply(this, args);
      c.set(stringedArgs, r);
      return r
    }
  }
  return cf
}

module.exports = cache;
