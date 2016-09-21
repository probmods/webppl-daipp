var runModel = require('../runModel.js');
var exp = require('./experiment.js');
var syscall = require('child_process').execSync;

// ----------------------------------------------------------------------------

// Play with running different experiments here

var baseProgramOpts = {
	model: 'bn_latentD',
	optimize_verbose: true,
	optimize_logProgress: 100,
	optimize_nSteps: 200,

	doELBOProgress: true,
	doDataLogProb: true,
	doGuideESS: false
};

// var conditions = [
// {
// 	name: 'No variance reduction',
// 	opts: {
// 		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: false, naiveLR: true } }
// 	}
// },
// {
// 	name: '+ per-variable weights',
// 	opts: {
// 		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: false } }
// 	}
// },
// {
// 	name: '+ baselines',
// 	opts: {
// 		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: true } }
// 	}
// },
// {
// 	name: '+ sum out discrete choice',
// 	opts: {
// 		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: true } },
// 		sumOut: true
// 	}
// }
// ];

var conditions = [
{
	name: 'True model',
	opts: {
		doModelLearning: false, 
		optimize_nSteps: 0,
		dataLogProb_useGuide: false,
		sumOut: true
	}
},
{
	name: 'Sample discretes',
	opts: {
		optimize_estimator: { ELBO2: { samples: 1, avgBaselines: true } }
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
		exp.repeat(10,
			exp.run(runModel)
		)
	)
);

// ELBO progress
if (baseProgramOpts.doELBOProgress) {
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
