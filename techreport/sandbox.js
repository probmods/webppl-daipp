var runModel = require('./runModel.js');

// ----------------------------------------------------------------------------

// Play with running different models here

var ret = runModel({
	model: 'vae',
	modelLearnType: 'ML_reg',
	optimize_verbose: true,
	optimize_logProgress: true,
	optimize_logProgressFilename: __dirname + '/vae_elboProgress.csv',
	optimize_checkpointParams: true,
	optimize_checkpointParamsFilename: __dirname + '/vae_params.json',
	optimize_checkpointParamsThrottle: 30000
});
// console.log(ret);