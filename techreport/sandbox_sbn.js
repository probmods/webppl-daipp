var runModel = require('./runModel.js');
var misc = require('./misc.js');
var fs = require('fs');

// ----------------------------------------------------------------------------

// // Train SBN

// var ret = runModel({
// 	model: 'sbn',
// 	modelLearnType: 'ML_reg',
// 	optimize_verbose: true,
// 	optimize_logProgress: true,
// 	optimize_checkpointParams: true,
// 	optimize_checkpointParamsThrottle: 30000,

// 	optimize_estimator: {ELBO2: {samples: 1, avgBaselines: true}},
// 	optimize_logProgressFilename: __dirname + '/output/sbn_elboProgress.csv',
// 	optimize_checkpointParamsFilename: __dirname + '/output/sbn_params.json'

// 	// optimize_estimator: {ELBO2: {samples: 1, avgBaselines: false}},
// 	// optimize_logProgressFilename: __dirname + '/output/sbn_elboProgress_noBaselines.csv',
// 	// optimize_checkpointParamsFilename: __dirname + '/output/sbn_params_noBaselines.json'

// 	// optimize_estimator: {ELBO2: {samples: 1, avgBaselines: false, naiveLR: true}},
// 	// optimize_logProgressFilename: __dirname + '/output/sbn_elboProgress_noGraph.csv',
// 	// optimize_checkpointParamsFilename: __dirname + '/output/sbn_params_noGraph.json'
// });

// ----------------------------------------------------------------------------

// Model specific returns for SBN

var ret = runModel({
	model: 'sbn',
	modelLearnType: 'ML_reg',
	loadParams: __dirname + '/output/sbn_params.json',
	doCustomReturns: true,

	sbn_encodeDecodeTargetIndices: [7815, 3940, 4242, 3709]
});

if (ret.sbnEncodeDecodeSamples) {
	ret.sbnEncodeDecodeSamples.forEach(function(targetGroup, i) {
		misc.saveTensorToGrayscaleImage(targetGroup.target, 28, 28,
			__dirname + '/output/sbn_encodeDecode_target_' + misc.zeropad(i, 3) + '_(id=' + targetGroup.index + ').png', function() {
				misc.saveTensorsToGrayscaleImages(targetGroup.reconstructions, 28, 28,
					__dirname + '/output/sbn_encodeDecode_target_' + misc.zeropad(i, 3) + '_sample');
			});
	});
}