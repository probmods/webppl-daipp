var _ = require('underscore');
var misc = require('./misc.js');
var fs = require('fs');
var runModel = require('./runModel.js');
var DataFrame = require('./experiments/dataFrame.js');

// ----------------------------------------------------------------------------

var basedir = '/Users/dritchie/Desktop/lda-results-for-tr';

// Combine elboProgress files
var elboProgress = DataFrame.merge('condition', [
	DataFrame.loadCSV(basedir + '/lda0/objective.csv'),
	DataFrame.loadCSV(basedir + '/lda100/objective.csv'),
	DataFrame.loadCSV(basedir + '/lda5/objective.csv'),
	DataFrame.loadCSV(basedir + '/lda6/objective.csv'),
], ['Mean field', 'Marginalized mean field', 'Word-level guide', 'Document-level guide']);
elboProgress.saveCSV(__dirname + '/experiments/elboProgress.csv');