'use strict';

var rnn = require('./rnn');
var cache = require('./cache');

var Tensor = T['__Tensor'];

module.exports = function(env, config) {

  var debug = config.debug;
  var latentSize = config.latentSize;
  var nneval = require('./nneval')(env, config);

  var arrayRNN = rnn.makeRU('rnn', latentSize, latentSize, 'arrayRNN', debug);

  //val2vec takes an object and turns it into a vector.
  function val2vec(val) {
    //NOTE: Number arrays (w/ fixed dim?) should be upgraded to tensor by hand
    //TODO: cache this for speed? we are likely to see the same values may times, especially for structured objects, eg address vectors.

    // console.log("val: "+ad.value(val)+" type "+betterTypeOf(val))

    switch(betterTypeOf(val)) {
    case 'number':
      //numbers are upgraded to tensor.
      //NOTE: integers currently treated as real, but could treat as Enum or one-hot.
      //NOTE: number may be lifted.
      val = ad.tensor.fromScalars(val);
    case 'tensor':
      //tensors are re-shaped and pushed through an MLP to get right dim
      //NOTE: tensor may be lifted.
      var len = ad.value(val).length;
      return nneval(tensorAdaptor(len, 'tensor_'+len), val);
    case 'array':
      //arrays are handled inductively
      //TODO: change init so that an array with one elt gets the same vec as the elt?
      var initvec = val2vec("emptyarrayvec");
      return val.reduce(function(vec, next){
        return nneval(arrayRNN, [vec, val2vec(next)]);
      },
                        initvec);
    case "function":
      //TODO: functions currently treated as object, so interesting things happen only if they provide an embed2vec... is there a smart default?
    case "object":
      //check if object provides embed2vec method, if so call it.
      //embed2vec methods take vec dim and callback to val2vec, return ebedding vector.
      //TODO: handle tensors by adding embed2vec method to tensor class? arrays?
      if (val.embed2vec !== undefined) {
        return val.embed2vec(val2vec, latentSize)
      }
      //otherwise treat as enum: only equal objects have same vec.
      return nneval(getConstant(val));
    default:
      //default case: treat as enum type and memoize embedding vector.
      //this catches, boolean, string, symbol, etc.
      return nneval(getConstant(val));
    }
  }

  var tensorAdaptor = cache(function(length, name){
    // dritchie: Should this be an MLP with a hidden layer + activation?
    var net = nn.linear(length, latentSize, name);
    net.setTraining(true);
    return net;
  });

  var getConstant = cache(function(val) {
    var name = util.serialize(val);
    var net = nn.constantparams([latentSize], name);
    net.setTraining(true);
    return net;
  });

  function betterTypeOf(val) {
    var type = typeof val
    if (type === 'object' && val === null) {
      return 'null';
    } else if (type === 'object' && ad.isLifted(val)) {
      return betterTypeOf(ad.value(val));
    } else if (type === 'object' && Array.isArray(val)) {
      return 'array';
    } else if (type === 'object' && val instanceof Tensor) {
      return 'tensor';
    } else {
      return type;
    }
  }

  return val2vec;

};
