// Utilities for running experiments and dealing with generated data

// ----------------------------------------------------------------------------

var _ = require('underscore');
var fs = require('fs');
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
			// If val is a string, we assume that optname refers to an actual
			//    property on the opts object, and val is its value
			if (_.isString(val)) {
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
function row(fn) {
	return function(opts, tablevel) {
		var ret = fn(opts, tablevel + 1);
		assert(_.isObject(ret), 'row computation must return object, not ' + ret);
		return [ ret ];
	};
}

// Apply pred to every column and keep only the ones for which pred evaluates to true
function filterData(data, pred) {
	return data.map(function(row) {
		var newrow = _.clone(row);
		_.keys(newrow).map(function(colname) {
			if (!pred(colname)) {
				delete newrow[colname];
			}
		});
		return newrow;
	});
}

// Take an array-valued column and, for each row, generate one row for each array entry.
function normalizeArrayColumn(data, colname) {
	var rowGroups = data.map(function(row) {
		var col = row[colname];
		assert(col !== undefined, 'Data row contains no column "' + colname + '"');
		assert(_.isArray(col), 'Column "' + colname + '" is not array-valued');
		return col.map(function(subrow) {
			assert(_.isObject(subrow), 'Array column "' + colname + '" does not contain row objects');
			var newrow = _.clone(row);
			delete newrow[colname];
			for (var subcolname in subrow) {
				newrow[colname + '_' + subcolname] = subrow[subcolname];
			}
			return newrow;
		});
	});
	return _.flatten(rowGroups);
}

// Save data to CSV file
function saveDataToCSV(data, filename) {
	// Compute headers
	var headers = _.keys(data[0]).sort();
	// Write data
	var csvfile = fs.openSync(filename, 'w');
	fs.writeSync(csvfile, headers.join(',') + '\n');
	data.forEach(function(row) {
		var cols = headers.map(function(colname) {
			var col = row[colname];
			assert(col !== undefined, 'Data row contains no column "' + colname + '"');
			assert(!_.isArray(col), 'Column "' + colname + '" is array-valued (must be normalized).');
			return col;
		});
		fs.writeSync(csvfile, cols.join(',') + '\n');
	});
	fs.closeSync(csvfile);
}

// Load up a CSV file
function loadDataFromCSV(filename) {
	var lines = fs.readFileSync(filename).toString().split('\n');
	if (lines[lines.length-1] === '') lines.pop(); 
	var header = lines[0].split(',');
	return lines.slice(1).map(function(line) {
		var toks = line.split(',');
		toks = toks.map(function(x) {
			var n = parseFloat(x);
			return _.isNaN(n) ? x : n;
		});
		return _.object(header, toks);
	});
}

// ----------------------------------------------------------------------------

module.exports = {
	start: start,
	repeat: repeat,
	condition: condition,
	row: row,
	filterData: filterData,
	normalizeArrayColumn: normalizeArrayColumn,
	saveDataToCSV: saveDataToCSV,
	loadDataFromCSV: loadDataFromCSV
};
