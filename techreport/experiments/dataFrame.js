// Functions that work with / transform data frames (sort of like dplyr)

// ----------------------------------------------------------------------------

var _ = require('underscore');
var fs = require('fs');
var assert = require('assert');

// ----------------------------------------------------------------------------

function DataFrame(data) {
	this.data = data;
};

// Select certain columns (or everything but those columns, if opts.negate is true)
DataFrame.prototype.select = function(colnames, opts) {
	// Determine which columns to keep
	var colnamesToKeep = {};
	_.keys(this.data[0]).forEach(function(colname) {
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
	return new DataFrame(this.data.map(function(row) {
		var newrow = _.clone(row);
		_.keys(newrow).map(function(colname) {
			if (!_.has(colnamesToKeep, colname)) {
				delete newrow[colname];
			}
		});
		return newrow;
	}));
};

DataFrame.prototype.remove = function(colnames) {
	return this.select(colnames, {negate: true});
};

// Keep only rows for which pred returns true
DataFrame.prototype.filter = function(pred) {
	return new DataFrame(this.data.filter(pred));
};

// Rename columns
DataFrame.prototype.rename = function(nameMap) {
	return new DataFrame(this.data.map(function(row) {
		var newrow = {};
		for (var colname in row) {
			newrow[nameMap[colname] || colname] = row[colname];
		}
		return newrow;
	}));
};

// Normalize an array-valued column by generating a row for each array entry,
//    adding new columns as necessary
DataFrame.prototype.normalizeArrayColumn = function(colname) {
	var rowGroups = this.data.map(function(row) {
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
	return new DataFrame(_.flatten(rowGroups));
};


// Save data to CSV file
DataFrame.prototype.saveCSV = function(filename) {
	// Compute headers
	var headers = _.keys(this.data[0]).sort();
	// Write data
	var csvfile = fs.openSync(filename, 'w');
	fs.writeSync(csvfile, headers.join(',') + '\n');
	this.data.forEach(function(row) {
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
	return this;
};

// Load up a CSV file
DataFrame.loadCSV = function(filename) {
	var lines = fs.readFileSync(filename).toString().split('\n');
	if (lines[lines.length-1] === '') lines.pop(); 
	var header = lines[0].split(',');
	return new DataFrame(lines.slice(1).map(function(line) {
		var toks = line.split(',');
		toks = toks.map(function(x) {
			var n = parseFloat(x);
			return _.isNaN(n) ? x : n;
		});
		return _.object(header, toks);
	}));
};

// Merge N frames, creating a new column 'colname'
// Each frame in 'frames' will take on the corresponding value in 'colvals'
//    for the column 'colname'
DataFrame.merge = function(colname, frames, colvals) {
	// Make sure they have the same header structure
	var protoRow = frames[0].data[0];
	for (var i = 1; i < frames.length; i++) {
		var row = frames[i].data[0];
		for (var prop in row) {
			assert(_.has(protoRow, prop), 'Frames must all have the same structure.');
		}
		for (var prop in protoRow) {
			assert(_.has(protoRow, prop), 'Frames must all have the same structure.');
		}
	}

	// Smash frames together
	var data = _.flatten(frames.map(function(frame, i) {
		var newcol = {};
		newcol[colname] = colvals[i];
		return frame.data.map(function(row) {
			return _.extend(_.clone(row), newcol);
		});
	}));

	return new DataFrame(data);
};

// ----------------------------------------------------------------------------

module.exports = DataFrame;

