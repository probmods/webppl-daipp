// Utilities for running experiments and generating data from them

// ----------------------------------------------------------------------------

var _ = require('underscore');
var assert = require('assert');

// ----------------------------------------------------------------------------

function spaces(n) {
	return _.range(n).map(function(i) { return ' ' }).join('');
}

// ----------------------------------------------------------------------------

// Start an experiment with some base options
function start(opts, nextfn) {
	console.log('Experiment start!');
	var data = nextfn(_.clone(opts), 1);
	console.log('Experiment done!');
	return data;
}

// Repeat something multiple times
function repeat(n, nextfn) {
	return function(opts, tablevel) {
		var rowGroups = _.range(n).map(function(i) {
			console.log(spaces(3*tablevel) + 'Repetition ' + (i+1) + '/' + n);
			return nextfn(opts, tablevel+1);
		});
		return _.flatten(rowGroups);
	};
};

// Execute something multiple times under different conditions
function condition(optname, values, nextfn) {
	return function(opts, tablevel) {
		var rowGroups = values.map(function(val) {
			var newopts = _.clone(opts);
			var valname;
			// If val is not an object, we assume that optname refers to an actual
			//    property on the opts object, and val is its value
			if (!_.isObject(val)) {
				valname = val;
				newopts[optname] = val;
			// Otherwise, if val is an object, we assume it is structured as
			//    {name:, opts:}
			} else {
				valname = val.name;
				_.extend(newopts, val.opts);
			}
			console.log(spaces(3*tablevel) + 'Condition: ' + optname + ' = ' + valname);
			var rows = nextfn(newopts, tablevel+1);
			return rows.map(function(row) {
				var newrow = _.clone(row);
				newrow[optname] = valname;
				return newrow;
			});
		});
		return _.flatten(rowGroups);
	};
}

// Make a data row out of a function which returns an object (mapping column name to value)
// This just boils down to wrapping the return value in an array, since we expect rows to be
//   passed around, never a singleton row.
function run(fn) {
	return function(opts, tablevel) {
		var ret = fn(opts, tablevel + 1);
		assert(_.isObject(ret), 'row computation must return object, not ' + ret);
		return [ ret ];
	};
}

// ----------------------------------------------------------------------------

module.exports = {
	start: start,
	repeat: repeat,
	condition: condition,
	run: run,
};
