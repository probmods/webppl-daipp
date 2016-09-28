var _ = require('underscore');

module.exports = {
  STEP_SIZE: _.range(1, 4, .5).map(x => Math.pow(10, -x)),
  DECAY_RATE_1: _.range(0, 1.75, .25).map(x => 1 - Math.pow(10, -x)),
  DECAY_RATE_2: _.range(0, 4.5, .5).map(x => 1 - Math.pow(10, -x))
};
