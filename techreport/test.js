var runModel = require('./runModel.js');
var exp = require('./experiment.js');
var data = require('./data.js');

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

var expdat = 
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

var lpAndESS = data.remove(expdat, ['elboProgress']);
data.saveCSV(lpAndESS, __dirname + '/dataLPAndESS.csv');

var elboProgress = data.remove(expdat, ['dataLogProb', 'guideESS']);
elboProgress = data.normalizeArrayColumn(elboProgress, 'elboProgress');
data.saveCSV(elboProgress, __dirname + '/elboProgress.csv');