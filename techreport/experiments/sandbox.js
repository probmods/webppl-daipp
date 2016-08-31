var runModel = require('../runModel.js');
var exp = require('./experiment.js');

// ----------------------------------------------------------------------------

// Play with running different experiments here

var baseProgramOpts = {
	model: 'bn_latentC',
	optimize_verbose: true,
	optimize_logProgress: 100
};

var data =
exp.start(baseProgramOpts,
	exp.repeat(10,
		exp.run(runModel)
	)
);

// Test LL and ESS
data
	.remove(['elboProgress'])
	.saveCSV(__dirname + '/dataLPAndESS.csv');

// ELBO progress
var renameMap = (function(basenames) {
	return _.object(
		basenames.map(function(n) { return 'elboProgress_'+n; }),
		basenames
	);
})(['index', 'iter', 'objective', 'time']);
data
	.remove(['dataLogProb', 'guideESS'])
	.normalizeArrayColumn('elboProgress')
	.rename(renameMap)
	.saveCSV(__dirname + '/elboProgress.csv');