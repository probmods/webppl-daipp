// Assumes WebPPL makes nn available globally.

var units = {
  rnn: function(hdim, xdim, name, debug) {
    // Create a simple recurrent unit.
    var net =  nn.sequence(
      [nn.linear(hdim+xdim, hdim), nn.tanh],
      name + ':activation',
      debug);
    var fn = function(args) {
      var hprev = args[0];
      var x = args[1];
      var hprevx = nn.concat.eval(hprev, x);
      return net.eval(hprevx);
    };
    return nn.compound(fn, [net, nn.concat], name);
  },

  gru: function(hdim, xdim, name, debug) {
    // Create a Gated Recurrent Unit.

    // Update gate.
    // z = sigmoid(Wz . [hprev, x])
    var updateNet = nn.sequence(
      [nn.linear(hdim+xdim, hdim), nn.sigmoid],
      name + ':update',
      debug);

    // Reset gate.
    // r = sigmoid(Wr . [hprev, x])
    var resetNet = nn.sequence(
      [nn.linear(hdim+xdim, hdim), nn.sigmoid],
      name + ':reset',
      debug);

    // Candidate activation.
    // h' = tanh(W . [r*hprev, x])
    var candidateNet = nn.sequence(
      [nn.linear(hdim+xdim, hdim), nn.tanh],
      name + ':activation',
      debug);

    // Take a single arg to play nicely with daipp's nneval.
    var fn = function(args) {
      var hprev = args[0];
      var x = args[1];
      var hprevx = nn.concat.eval(hprev, x);
      var z = updateNet.eval(hprevx);
      var r = resetNet.eval(hprevx);
      var candidate = candidateNet.eval(nn.concat.eval(nn.mul.eval(r, hprev), x));
      // Output.
      // h = (1-z)*hprev + z*h'
      var h = nn.add.eval(nn.mul.eval(nn.add.eval(nn.mul.eval(z, -1), 1), hprev), nn.mul.eval(z, candidate));
      return h;
    };

    var subnets = [updateNet, resetNet, candidateNet, nn.concat, nn.mul, nn.add];
    return nn.compound(fn, subnets, name);
  }
};

// TODO: LSTM?

var makeRU = function(type, hdim, xdim, name, debug) {
  var constructor = units[type];
  if (!constructor) {
    throw new Error('daipp: Unknown recurrent unit type.');
  }
  if (!name) {
    throw new Error('daipp: Name must be given.');
  }
  var net = constructor(hdim, xdim, name, debug);
  net.setTraining(true);
  return net;
};

var makeUpdateNet = function(config, name) {
  var constructor = config.updateNetSkip ? makeUpdateNetWithSkip : makeUpdateNetNoSkip;
  return constructor(config.updateNetType, config.latentSize, name, config.debug);
};

var makeUpdateNetNoSkip = function(type, dim, name, debug) {
  var ru = makeRU(type, dim, 2 * dim, name + ':ru', debug);
  var fn = function(args) {
    var ctx = args[0];     // Previous context.
    var val = args[1];     // Value vector.
    var address = args[2]; // Address vector.
    return ru.eval([ctx, ad.tensor.concat(val, address)]);
  };
  return nn.compound(fn, [ru], name);
};

var makeUpdateNetWithSkip = function(type, dim, name, debug) {

  // c*ctx + (1-c)*val + net(ctx, concat(val, address))
  //
  // Here 'net' is a recurrent unit with type specified by the 'type'
  // parameter of this function. 'c' is a scalar in [0,1].
  //
  // When type is 'rnn' I think this implements the "bi-linear resnet"
  // idea.

  var ru = makeRU(type, dim, 2 * dim, name + ':ru', debug);

  // TODO: Noah suggests initializing c close to one, so that we have
  // pass through of the context at the start of optimization. How can
  // we do this initialization? If we can't influence the adnn init.
  // maybe just add a small constant to cParam?
  var cParam = nn.constantparams([1], name + ':c');
  cParam.setTraining(true);

  var fn = function(args) {
    var ctx = args[0];     // Previous context.
    var val = args[1];     // Value vector.
    var address = args[2]; // Address vector.
    var newCtx = ru.eval([ctx, ad.tensor.concat(val, address)]);
    // Skip connections.
    var c = ad.tensorEntry(nn.sigmoid.eval(cParam.eval()), 0);
    return nn.add.eval(nn.mul.eval(nn.sub.eval(ctx, val), c), nn.add.eval(val, newCtx));
  };

  var subnets = [ru, cParam, nn.sigmoid, nn.add, nn.sub, nn.mul];
  return nn.compound(fn, subnets, name);
};

module.exports = {
  makeRU: makeRU,
  makeUpdateNet: makeUpdateNet
};
