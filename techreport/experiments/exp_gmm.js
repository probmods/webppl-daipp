var runModel = require('../runModel.js');
var exp = require('./experiment.js');
var DataFrame = require('./dataFrame.js');
var syscall = require('child_process').execSync;

// ----------------------------------------------------------------------------

var baseProgramOpts = {
	model: 'bn_latentD',
	optimize_verbose: true,
	optimize_logProgress: 100,
	optimize_nSteps: 200,

	optimize_logProgress: true,
	optimize_logProgressFilename: __dirname + '/elboProgress_tmp.csv',
	doDataLogProb: true,
	doGuideESS: false
};

var conditions = [
{
	name: 'True model',
	opts: {
		optimize_logProgress: false,
		doModelLearning: false, 
		optimize_nSteps: 0,
		dataLogProb_useGuide: false,
		sumOut: true
	}
},
{
	name: 'Sample discretes',
	opts: {
		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: true } },
	}
},
{
	name: 'Sum out discretes',
	opts: {
		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: true } },
		sumOut: true
	}
}
];

var data =
exp.start(baseProgramOpts,
	exp.condition('condition', conditions,
		exp.repeat(1,
			exp.run(function(opts) {
				var ret = runModel(opts);
				if (opts.optimize_logProgress) {
					ret.elboProgress = DataFrame.loadCSV(opts.optimize_logProgressFilename).data;
					syscall('rm -f ' + opts.optimize_logProgressFilename);
				} else {
					ret.elboProgress = [];
				}
				return ret;
			})
		)
	)
);

// ELBO progress
if (baseProgramOpts.optimize_logProgress) {
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
}

// Test LL and ESS
if (baseProgramOpts.doDataLogProb || baseProgramOpts.doGuideESS) {
	data
		.remove(['elboProgress'])
		.saveCSV(__dirname + '/dataLPAndESS.csv');

}


// Call R script to generate plots
syscall('rscript ' + __dirname + '/sandbox.r');
