var runModel = require('./runModel.js');

// ----------------------------------------------------------------------------

// Play with running different models here

var ret = runModel(
{
	model: 'bn_latentCC',
	modelLearnType: 'ML_reg',
	optimize_verbose: true,
	doELBOProgress: false

	// model: 'lda',
	// modelLearnType: 'MeanField',
	// optimize_verbose: true,
	// optimize_nSteps: 500,
	// doELBOProgress: false
});
console.log(ret);