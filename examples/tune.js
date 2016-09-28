var child_process = require('child_process');
var process = require('process');
var path = require('path');
var assert = require('assert');

var _ = require('underscore');

var pp = function(obj) { console.log(JSON.stringify(obj, null, 2)); };
var sample = _.partial(_.mapObject, _, _.sample);

var main = function() {
  if (process.argv.length < 4) {
    console.log('Usage: node tune.js param_space_js command [number_of_runs]');
    process.exit();
  }

  var param_space_js = process.argv[2];
  var command = process.argv[3];
  var n = process.argv.length < 5 ? Infinity : parseInt(process.argv[4]);
  assert.ok(!_.isNaN(n), 'Number of runs is not a number.');
  var space = require(path.resolve(param_space_js));

  console.log('Command:', command);
  console.log('Number of runs:', n);
  console.log('Parameter space:');
  pp(space);

  var i = 0;
  while (i++ < n) {
    var params = sample(space);
    console.log('--------------------------------------------------');
    pp(params);
    var ret = child_process.spawnSync(command, {env: params});
    if (ret.status !== 0) {
      if (ret.error) { pp(ret.error); }
      if (ret.stdout) { console.log(ret.stdout.toString()); }
      if (ret.stderr) { console.log(ret.stderr.toString()); }
    }
  }
};

main();
