'use strict';

var assert = require('assert');

module.exports = function(env, config) {

  // TODO: Move to adnn.
  function xavierInit(t) {
    var scale;
    if (t.rank === 1) {
      // Init. biases to tiny values to avoid zero gradient warnings
      // on first optimization step.
      scale = 1e-5;
    } else if (t.rank === 2) {
      scale = 1 / Math.sqrt(t.dims[1]);
    } else {
      throw 'xavierInit: Unexpected rank.';
    }
    var n = t.length;
    while (n--) {
      t.data[n] = dists.gaussianSample(0, scale);
    }
  }

  // Wrap a net's getParameters function with a function that
  // re-initializes all parameters using the Xavier initialization
  // scheme.

  // One further advantage of this is that initialization can be made
  // repeatable using webppl's --random-seed option.

  function wrapGetParamsWithXavier(nn) {
    return function() {
      var params = nn.getParameters().map(ad.value);
      params.forEach(xavierInit);
      // It's OK that we don't re-lift params here, registerParams
      // handles this.
      return params;
    };
  }

  function nnparams(nn) {
    // TODO: If we accidentally use some net in more than one e.g.
    // nn.sequence, will we register its parameters more than once?
    // Does that cause the gradient step to be applied more than once?
    var params = nn.getParameters();
    if (params.length > 0) {
      // console.log('nnparams - has params');
      assert.ok(nn.name && nn.name.length > 0, 'daipp: Parameterized net cannot be anonymous.');
      assert.ok(nn.isTraining, 'daipp: Net "' + nn.name + '" is not in training mode.');
      util.registerParams(env, nn.name,
                          config.useXavierInit ? wrapGetParamsWithXavier(nn) : nn.getParameters.bind(nn),
                          function(prms) { params = prms; });
    }
    return params;
  }

  // By using this function throughout daipp (rather than calling
  // nn.eval directly) we ensure that inference coroutines are aware
  // of the parameters of all neural network.
  function nneval(nn, arg) {
    var params = nnparams(nn);
    if (params.length > 0) {
      nn.setParameters(params);
    }
    return nn.eval(arg);
  }

  return {
    nnparams: nnparams,
    nneval: nneval
  };

};
