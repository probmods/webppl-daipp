var misc = require('./misc.js');
var fs = require('fs');
var runModel = require('./runModel.js');
var DataFrame = require('./experiments/dataFrame.js');

// ----------------------------------------------------------------------------

// // Make QMR graph

// var qmr = misc.makeRandomQMRGraph({
// 	numDiseases: 200,
// 	numSymptoms: 100,

// 	minCauses: 1,
// 	maxCauses: 4,

// 	minBaseProb: 0,
// 	maxBaseProb: 0.2,

// 	minLeakProb: 0,
// 	maxLeakProb: 0.1,

// 	minConditionalProb: 0.2,
// 	maxConditionalProb: 1
// });

// fs.writeFileSync(__dirname + '/qmrGraph.json', JSON.stringify(qmr));

// ----------------------------------------------------------------------------

// // Train QMR

// var ret = runModel({
// 	model: 'qmr',
// 	optimize_verbose: true,

// 	optimize_logProgress: true,
// 	optimize_checkpointParams: true,
// 	optimize_checkpointParamsThrottle: 60000,

// 	// ---------------------------------------

// 	// optimize_estimator: {ELBO2: {samples: 1, avgBaselines: true}},
// 	// optimize_logProgressFilename: __dirname + '/output/qmr_elboProgress_handGuide.csv',
// 	// optimize_checkpointParamsFilename: __dirname + '/output/qmr_params_handGuide.json',

// 	// optimize_optMethod: { adam: { stepSize: 0.001 } },
// 	// optimize_estimator: {ELBO2: {samples: 1, avgBaselines: false}},
// 	// optimize_logProgressFilename: __dirname + '/output/qmr_elboProgress_handGuide_noBaselines.csv',
// 	// optimize_checkpointParamsFilename: __dirname + '/output/qmr_params_handGuide_noBaselines.json',

// 	// optimize_optMethod: { adam: { stepSize: 0.00001 } },
// 	// optimize_estimator: {ELBO2: {samples: 1, avgBaselines: false, naiveLR: true}},
// 	// optimize_logProgressFilename: __dirname + '/output/qmr_elboProgress_handGuide_noGraph.csv',
// 	// optimize_checkpointParamsFilename: __dirname + '/output/qmr_params_handGuide_noGraph.json',

// 	localGuideType: 'MeanField',
// 	optimize_estimator: {ELBO2: {samples: 1, avgBaselines: true}},
// 	optimize_logProgressFilename: __dirname + '/output/qmr_elboProgress_meanField.csv',
// 	optimize_checkpointParamsFilename: __dirname + '/output/qmr_params_meanField.json',
// });

// ----------------------------------------------------------------------------

// // Test QMR

// var ret = runModel({
// 	model: 'qmr',
// 	optimize_verbose: true,

// 	// doGuideESS: true,
// 	// ess_saveEstimates: true,
// 	// ess_nDataPoints: 50,

// 	doCustomReturns: true,

// 	// ---------------------------------------

// 	// loadParams: __dirname + '/output/qmr_params_handGuide.json',
// 	// loadParams: __dirname + '/output/qmr_params_handGuide_noBaselines.json',
// 	loadParams: __dirname + '/output/qmr_params_handGuide_noGraph.json',

// 	// localGuideType: 'MeanField',
// 	// loadParams: __dirname + '/output/qmr_params_meanField.json',
// });

// fs.writeFileSync(
// 	// __dirname + '/output/qmr_scores_handGuide.csv',
// 	// __dirname + '/output/qmr_scores_handGuide_noBaselines.csv',
// 	__dirname + '/output/qmr_scores_handGuide_noGraph.csv',
// 	'score\n' + ret.qmrReconstructedDataLikelihood_scores.join('\n')
// );

// ----------------------------------------------------------------------------

// Combine elboProgress files
var elboProgress = DataFrame.merge('condition', [
	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_meanField.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide_noGraph.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide_noBaselines.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide.csv'),
], ['Mean field', 'Amortized', '+ per-choice weights', '+ baselines']);
elboProgress.saveCSV(__dirname + '/experiments/elboProgress.csv');


// Combine score files
var reconstructScores = DataFrame.merge('condition', [
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide_noGraph.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide_noBaselines.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide.csv'),
], ['Amortized', '+ per-choice weights', '+ baselines']);
reconstructScores.saveCSV(__dirname + '/experiments/qmr_reconstructScores.csv');


