'use strict';

var assert = require('assert');
var cache = require('./cache');
var Tensor = T['__Tensor'];

module.exports = function(env, config) {

  var latentSize = config.latentSize;
  var nneval = require('./nneval')(env, config);

  /*
   This goes from a vector (created from context etc) to an importance distribution.
   dist is the target distribution
   This function is responsible for deciding which importance distribution to use. Returns a distribution.
   */
  function vec2dist(vec, dist) {
    var guideDistType, guideParamNets;
    if (dist instanceof dists.Bernoulli) {
      //importance distribution is Bernoulli, param is single bounded real
      guideDistType = dists.Bernoulli;
      guideParamNets = makeParamAdaptorNets({p: {dim:[1], dom:[0,1]}}, 'Bernoulli');
    } else if (dist instanceof dists.Gaussian) {
      // TODO: Try guiding with (differentiable) mixture of Gaussians.
      // TODO: How to set number of components?
      //var ncomponents = 2;
      //guideDistType = GaussianMixture;
      //guideParamNets = makeParamAdaptorNets([[ncomponents], [ncomponents]], 'GMM');
      guideDistType = dists.Gaussian;
      guideParamNets = makeParamAdaptorNets({mu: [1], sigma: {dim: [1], dom: [0, Infinity]}}, 'Gaussian');
    } else if (dist instanceof dists.Gamma) {
      guideDistType = dists.Gamma;
      guideParamNets = makeParamAdaptorNets({
        shape: {dim: [1], dom: [0, Infinity]},
        scale: {dim: [1], dom: [0, Infinity]}
      }, 'Gamma');
    } else if (dist instanceof dists.DiagCovGaussian) {
      guideDistType = dists.DiagCovGaussian;
      var distDim = ad.value(dist.params.mu).length;
      guideParamNets = makeParamAdaptorNets({mu: [distDim, 1], sigma: {dim: [distDim, 1], dom: [0, Infinity]}}, 'DiagCovGaussian');
    } else if (dist instanceof dists.Dirichlet) {
      guideDistType = dists.LogisticNormal;
      var distDim = ad.value(dist.params.alpha).length;
      guideParamNets = makeParamAdaptorNets({
        mu: [distDim-1, 1],
        sigma: {dim: [distDim-1, 1], dom: [0, Infinity]}
      }, 'Dirichlet');
    } else if (dist instanceof dists.Discrete) {
      guideDistType = dists.Discrete;
      // This will work for either array or vector valued ps.
      var distDim = ad.value(dist.params.ps).length;
      guideParamNets = makeParamAdaptorNets({
        ps: {dim: [distDim, 1], dom: [0, Infinity]}
      }, 'Discrete');
    } else {
      throw 'daipp: Unhandled distribution type in vec2dist: ' + dist;
    }
    // TODO: More distributions.

    var guideParams = _.mapObject(guideParamNets, function(net) {
      var out = nneval(net, vec);
      var _out = ad.value(out);
      return (_out instanceof Tensor) && isSingleton(_out) ? ad.tensor.get(out, 0) : out;
    });
    var guide = new guideDistType(guideParams);
    return guide;
  }

  function isSingleton(t) {
    return t.rank === 1 && t.dims[0] === 1;
  }

  function cumProd(dims) {
    var size = 1;
    var n = dims.length;
    while (n--) size *= dims[n];
    return size;
  }

  // This function creates an adaptor network that goes from the fixed-size predict vector to whatever size and shape are needed
  //   in the importance distributions... if domains are provided on the return tensors then a rescaling function is applied.
  // sizes is an object mapping from parameter names to shapes. if a shape is an array it is assumed to be the tensor dims and the domain unbounded;
  //    if it is an object, it is assumed to have fields for dim and domain bounds.
  // name arg is just there so that different distributions with same shape params can get different adaptors.
  var makeParamAdaptorNets = cache(function(sizes, name) {
    return _.mapObject(sizes, function(size, paramName) {
      var dim = (size.dim === undefined) ? size : size.dim;
      var flatlength = cumProd(dim);
      // dritchie: Should this be an MLP with a hidden layer + activation?
      var net = nn.linear(latentSize, flatlength);
      if (size.dom !== undefined){
        net = nn.sequence([net, getSquishnet(size.dom[0], size.dom[1])]);
      }
      // Only do reshape if dim has rank > 1
      if (dim.length > 1) {
        net = nn.sequence([net, nn.reshape(dim)]);
      }
      var netname = name + '_' + paramName;
      net.name = netname;
      net.setTraining(true);
      return net;
    });
  });

  //helper to squish return vals into range [a,b]
  var getSquishnet = cache(function(a, b) {
    assert(!(a === -Infinity && b === Infinity)); // Should use no bounds, in this case
    var adfun;
    if (a === -Infinity) {
      adfun = function(x) {
        var y = ad.tensor.log(ad.tensor.add(ad.tensor.exp(x), 1));
        return ad.tensor.add(ad.tensor.neg(y), b);
      };
    } else if (b === Infinity) {
      adfun = function(x) {
        var y = ad.tensor.log(ad.tensor.add(ad.tensor.exp(x), 1));
        return ad.tensor.add(y, a);
      };
    } else {
      adfun = function(x){
        var y = ad.tensor.sigmoid(x);
        return ad.tensor.add(ad.tensor.mul(y, b-a), a);
      };
    }
    return nn.lift(adfun) // No need to name this net, since it has no params
  });

  return vec2dist;

};
