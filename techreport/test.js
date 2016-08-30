var runModel = require('./runModel.js');
var exp = require('./experiment.js');

// var ret = runModel(
// {
// 	programOpts:  {
// 		model: 'bn_latentCC',
// 		modelLearnType: 'ML_reg',
// 		optimize_verbose: true,
// 		doELBOProgress: false
// 	},
// 	// programOpts:  {
// 	// 	model: 'lda',
// 	// 	modelLearnType: 'MeanField',
// 	// 	optimize_verbose: true,
// 	// 	optimize_nSteps: 500,
// 	// 	doELBOProgress: false
// 	// },
// 	runtimeOpts:  {

// 	}
// });
// console.log(ret);

// ----------------------------------------------------------------------------

var runtimeOpts = {

};

var baseProgramOpts = {
	model: 'bn_latentCC',
	optimize_verbose: true
};

var data = 
exp.start(baseProgramOpts,
	exp.condition('guideDependence', [false, true],
		exp.condition('localGuideType', ['MeanField', 'Recognition'],
			exp.run(function(programOpts) {
				return runModel({
					programOpts: programOpts,
					runtimeOpts: runtimeOpts
				});
			})
		)
	)
);

data
	.remove(['elboProgress'])
	.saveCSV(__dirname + '/dataLPAndESS.csv');

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