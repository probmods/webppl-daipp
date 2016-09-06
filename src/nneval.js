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

  // dritchie: We need a function that wraps any call to nn.eval(), which will do parameter registration
  // -------------
  // Doing this in raw WebPPL would be incorrect; the address at each call to eval() could be different,
  //    and so we'd end up registering multiple sets of parameters for the same network
  // Doing parameter registration on nn creation would allow us to use the current address, but presents
  //    other problems: (1) some nets are created at the global scope, outside any inference thunk (see
  //    the nets in DAIPP.wppl); (2) other nets are memoized, so parameter registration will not happen
  //    if multiple coroutines are called (e.g. in EUBO followed by SMC, params passed into SMC will not
  //    be registered to the nn's because their cached creation functions won't be called again).
  // -------------
  function nneval(nn, arg) {
    // TODO: parameter registration (only if the nn has > 0 parameters)
    // We will need a non-CPS'ed 'registerParams' that takes an explicit name/address
    // This also needs to incorporate the base address of the current coroutine, so that the parameter
    //    relative addressing scheme works, and also so nested inference works with DAIPP.

    // registerParams is made globally available in the WebPPL header.
    if (nn.getParameters().length > 0) {
      assert.ok(nn.name && nn.name.length > 0, 'daipp: Parameterized net cannot be anonymous.');
      util.registerParams(env, nn.name,
                          config.useXavierInit ? wrapGetParamsWithXavier(nn) : nn.getParameters.bind(nn),
                          nn.setParameters.bind(nn));
    }

    // Fast version, assuming all nets take at most one argument
    return nn.eval(arg);

    // Less efficient, fully-general version using varargs
    // var NN = Object.getPrototype(nn);
    // return NN.eval.apply(nn, Array.prototype.slice.call(arguments, 1));
  }

  return nneval;

};
