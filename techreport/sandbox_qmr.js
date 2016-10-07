var _ = require('underscore');
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

// 	// minBaseProb: 0,
// 	// maxBaseProb: 0.2,

// 	minBaseProb: 0.49,
// 	maxBaseProb: 0.51,

// 	minLeakProb: 0,
// 	maxLeakProb: 0.1,

// 	// minConditionalProb: 0.2,
// 	// maxConditionalProb: 1

// 	minConditionalProb: 0.75,
// 	maxConditionalProb: 1
// });

// // fs.writeFileSync(__dirname + '/qmrGraph.json', JSON.stringify(qmr));
// // fs.writeFileSync(__dirname + '/qmrGraph2.json', JSON.stringify(qmr));
// fs.writeFileSync(__dirname + '/qmrGraph3.json', JSON.stringify(qmr));

// ----------------------------------------------------------------------------

// // Train QMR

// // For recurrent versions
// global.DAIPP_CONFIG = {
// 	useXavierInit: true
// };

// function trainQMR(conditionOpts) {
// 	var opts = {
// 		model: 'qmr',
// 		optimize_nSteps: 10000,
// 		optimize_verbose: true,
// 		optimize_logProgress: true,
// 		optimize_checkpointParams: true,
// 		optimize_checkpointParamsThrottle: 60000,
// 		optimize_estimator: {ELBO2: {samples: 1, avgBaselines: true}},
// 		optimize_optMethod: { adam: { stepSize: 0.01 } },

// 		optimize_logProgressFilename: __dirname + '/output/qmr_elboProgress_' + conditionOpts.conditionName + '.csv',
// 		optimize_checkpointParamsFilename: __dirname + '/output/qmr_params_' + conditionOpts.conditionName + '.json'
// 	};
// 	for (var prop in conditionOpts) {
// 		opts[prop] = conditionOpts[prop];
// 	}

// 	runModel(opts);
// }

// (function() {

// // trainQMR({ conditionName: 'handGuide' });
// // trainQMR({
// // 	conditionName: 'handGuide_2layer',
// // 	jointGuideNumLayers: 2,
// // 	optimize_optMethod: { adam: { stepSize: 0.001 } }
// // });
// // trainQMR({
// // 	conditionName: 'handGuide_noBaselines',
// // 	optimize_optMethod: { adam: { stepSize: 0.001 } },
// // 	optimize_estimator: {ELBO2: {samples: 1, avgBaselines: false}}
// // });
// // trainQMR({
// // 	conditionName: 'handGuide_noGraph',
// // 	optimize_optMethod: { adam: { stepSize: 0.00001 } },
// // 	optimize_estimator: {ELBO2: {samples: 1, avgBaselines: false, naiveLR: true}}
// // });
// // trainQMR({
// // 	conditionName: 'meanField',
// // 	localGuideType: 'MeanField'
// // });

// // Factored versions
// var facOpts = {
// 	model: 'qmr_factoredGuide',
// };
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_initData',
// // 	rnnGuideType: 'RNNInitWithData',
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_initData_rnn',
// // 	rnnGuideType: 'RNNInitWithData',
// // 	rnnType: 'rnn',
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_initNone',
// // 	rnnGuideType: 'RNNInitWithNothing',
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_initNone_rnn',
// // 	rnnGuideType: 'RNNInitWithNothing',
// // 	rnnType: 'rnn',
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_initNone_noRecur',
// // 	rnnGuideType: 'PredictOneProb'
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_explicitState',
// // 	rnnGuideType: 'NonRecurrentState'
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_diffNets',
// // 	rnnGuideType: 'DifferentNetPerChoice',
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_diffNetsRNN',
// // 	rnnGuideType: 'DifferentNetPerChoiceRNN',
// // }, facOpts));
// // trainQMR(_.defaults({
// // 	conditionName: 'recurGuide_withAddress_string',
// // 	rnnGuideType: 'RecurrentWithAddress',
// // 	addressEmbedType: 'string'
// // }, facOpts));
// trainQMR(_.defaults({
// 	conditionName: 'recurGuide_withAddress_array',
// 	rnnGuideType: 'RecurrentWithAddress',
// 	addressEmbedType: 'array'
// }, facOpts));

// })();

// ----------------------------------------------------------------------------

// // Test QMR

// function testQMR(conditionOpts) {
// 	var opts = {
// 		model: 'qmr',
// 		doCustomReturns: true
// 	};
// 	if (conditionOpts.optimize_nSteps > 0) {
// 		opts.loadParams = __dirname + '/output/qmr_params_' + conditionOpts.conditionName + '.json'
// 	}
// 	for (var prop in conditionOpts) {
// 		opts[prop] = conditionOpts[prop];
// 	}

// 	console.log('===========================================');
// 	console.log('TESTING ' + conditionOpts.conditionName);

// 	var ret = runModel(opts);

// 	fs.writeFileSync(__dirname + '/output/qmr_scores_'+ conditionOpts.conditionName + '.csv',
// 		'score\n' + ret.qmrScores.join('\n'));
// }

// (function() {

// // testQMR({
// // 	conditionName: 'random'
// // 	optimize_nSteps: 0
// // });
// // testQMR({
// // 	conditionName: 'prior',
// // 	optimize_nSteps: 0,
// // 	qmrScoreUseGuide: false
// // });
// // testQMR({ conditionName: 'handGuide' });
// // testQMR({
// // 	conditionName: 'handGuide_2layer',
// // 	jointGuideNumLayers: 2
// // });
// // testQMR({ conditionName: 'handGuide_noBaselines' });
// // testQMR({ conditionName: 'handGuide_noGraph' });

// // // Factored versions
// var facOpts = { model: 'qmr_factoredGuide' };
// // // testQMR(_.defaults({
// // // 	rnnGuideType: 'RNNInitWithData',
// // // 	conditionName: 'recurGuide_initData'
// // // }, facOpts));
// // // testQMR(_.defaults({
// // // 	rnnGuideType: 'RNNInitWithData',
// // // 	rnnType: 'rnn',
// // // 	conditionName: 'recurGuide_initData_rnn'
// // // }, facOpts));
// // testQMR(_.defaults({
// // 	rnnGuideType: 'RNNInitWithNothing',
// // 	conditionName: 'recurGuide_initNone'
// // }, facOpts));
// // // testQMR(_.defaults({
// // // 	rnnGuideType: 'RNNInitWithNothing',
// // // 	rnnType: 'rnn',
// // // 	conditionName: 'recurGuide_initNone_rnn'
// // // }, facOpts));
// // testQMR(_.defaults({
// // 	rnnGuideType: 'PredictOneProb',
// // 	conditionName: 'recurGuide_initNone_noRecur'
// // }, facOpts));
// // // testQMR(_.defaults({
// // // 	rnnGuideType: 'NonRecurrentState',
// // // 	conditionName: 'recurGuide_explicitState'
// // // }, facOpts));
// // testQMR(_.defaults({
// // 	rnnGuideType: 'DifferentNetPerChoice',
// // 	conditionName: 'recurGuide_diffNets'
// // }, facOpts));
// // testQMR(_.defaults({
// // 	rnnGuideType: 'DifferentNetPerChoiceRNN',
// // 	conditionName: 'recurGuide_diffNetsRNN'
// // }, facOpts));
// testQMR(_.defaults({
// 	rnnGuideType: 'RecurrentWithAddress',
// 	addressEmbedType: 'string',
// 	conditionName: 'recurGuide_withAddress_string'
// }, facOpts));

// })();

// ----------------------------------------------------------------------------

// // Combine elboProgress files
// var elboProgress = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_meanField.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide_noGraph.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide_noBaselines.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide.csv'),
// ], ['Mean field', 'Amortized', '+ per-choice weights', '+ baselines']);
// elboProgress.saveCSV(__dirname + '/experiments/elboProgress.csv');


// // Combine score files
// var reconstructScores = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_prior.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide.csv'),
// ], ['Prior', 'Guide']);
// reconstructScores.saveCSV(__dirname + '/experiments/qmr_reconstructScores.csv');

// ----------------------------------------------------------------------------
// (Factored version)

// Combine elboProgress files
// var elboProgress = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_initData.csv'),
// 	// DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_initData_rnn.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_initNone.csv'),
// 	// DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_initNone_rnn.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_initNone_noRecur.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_explicitState.csv'),
// 	// DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide.csv'),
// 	],
// 	// ['Data Init (GRU)', 'Data Predict (GRU)', 'Data Predict', 'Explicit State', 'Joint Predict']);
// ['Data Init (GRU)', 'Data Predict (GRU)', 'Data Predict', 'Explicit State']);
// elboProgress.saveCSV(__dirname + '/experiments/elboProgress.csv');

// // Combine score files
// var reconstructScores = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initData.csv'),
// 	// DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initData_rnn.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone.csv'),
// 	// DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone_rnn.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone_noRecur.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_explicitState.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_diffNets.csv'),
// 	],
// 	['Data Init (GRU)', 'Data Predict (GRU)', 'Data Predict', 'Explicit State', 'Joint Predict', 'Per-Choice Net']);
// reconstructScores.saveCSV(__dirname + '/experiments/qmr_reconstructScores.csv');

// // Combine score files
// var reconstructScores = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initData.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initData_rnn.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone_rnn.csv'),
// 	],
// 	['Data Init (GRU)', 'Data Init (RNN)', 'Data Predict (GRU)', 'Data Predict (RNN)']);
// reconstructScores.saveCSV(__dirname + '/experiments/qmr_reconstructScores.csv');

// Combine score files
var reconstructScores = DataFrame.merge('condition', [
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide_2layer.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_diffNets.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_diffNetsRNN.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone_noRecur.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_initNone.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_withAddress_string.csv'),
	DataFrame.loadCSV(__dirname + '/output/qmr_scores_random.csv'),
	],
	['Joint', 'Joint (2 Layer)', 'Per-Choice Net', 'Per-Choice Net (GRU)', 'Single Net', 'Single Net (GRU)', 'Single Net (GRU + Address)', 'Random']);
reconstructScores.saveCSV(__dirname + '/experiments/qmr_reconstructScores.csv');


// // Combine elboProgress files
// var elboProgress = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_diffNets.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_recurGuide_diffNetsRNN.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_elboProgress_handGuide.csv'),
// 	],
// ['Factored', 'Factored + GRU', 'Joint']);
// elboProgress.saveCSV(__dirname + '/experiments/elboProgress.csv');

// // Combine score files
// var reconstructScores = DataFrame.merge('condition', [
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_diffNets.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_recurGuide_diffNetsRNN.csv'),
// 	DataFrame.loadCSV(__dirname + '/output/qmr_scores_handGuide.csv'),
// 	],
// 	['Factored', 'Factored + GRU', 'Joint']);
// reconstructScores.saveCSV(__dirname + '/experiments/qmr_reconstructScores.csv');

