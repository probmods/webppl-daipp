// Functions that work with / transform data frames (sort of like dplyr)

// ----------------------------------------------------------------------------

var _ = require('underscore');
var fs = require('fs');
var assert = require('assert');

// ----------------------------------------------------------------------------

// Select certain columns (or everything but those columns, if opts.negate is true)
function select(data, colnames, opts) {
	// Determine which columns to keep
	var colnamesToKeep = {};
	_.keys(data[0]).forEach(function(colname) {
		if (opts.negate) {
			if (colnames.indexOf(colname) === -1) {
				colnamesToKeep[colname] = true;
			}
		} else {
			if (colnames.indexOf(colname) !== -1) {
				colnamesToKeep[colname] = true;
			}
		}
	});
	// Select these columns from data
	return data.map(function(row) {
		var newrow = _.clone(row);
		_.keys(newrow).map(function(colname) {
			if (!_.has(colnamesToKeep, colname)) {
				delete newrow[colname];
			}
		});
		return newrow;
	});
}

function remove(data, colnames) {
	return select(data, colnames, {negate: true});
}

// Keep only rows for which pred returns true
function filter(data, pred) {
	return data.filter(pred);
}

// Rename columns
function rename(data, nameMap) {
	return data.map(function(row) {
		var newrow = {};
		for (var colname in row) {
			newrow[nameMap[colname] || colname] = row[colname];
		}
		return newrow;
	});
}

// Normalize an array-valued column by generating a row for each array entry,
//    adding new columns as necessary
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
function saveCSV(data, filename) {
	// Compute headers
	var headers = _.keys(data[0]).sort();
	// Write data
	var csvfile = fs.openSync(filename, 'w');
	fs.writeSync(csvfile, headers.join(',') + '\n');
	data.forEach(function(row) {
		var cols = headers.map(function(colname) {
			var col = row[colname];
			assert(col !== undefined, 'Data row contains no column "' + colname + '"');
			assert(!_.isArray(col), 'Column "' + colname +
				'" is array-valued (use "normalizeArrayColumn" first).');
			return col;
		});
		fs.writeSync(csvfile, cols.join(',') + '\n');
	});
	fs.closeSync(csvfile);
}

// Load up a CSV file
function loadCSV(filename) {
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
	select: select,
	remove: remove,
	rename: rename,
	filter: filter,
	normalizeArrayColumn: normalizeArrayColumn,
	saveCSV: saveCSV,
	loadCSV: loadCSV
};

