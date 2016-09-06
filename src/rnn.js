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

// TODO: Add "bilinear resnet", LSTM.

module.exports = {
  makeRU: function(type, hdim, xdim, name, debug) {
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
  }
};
