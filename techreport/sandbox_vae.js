var runModel = require('./runModel.js');
var misc = require('./misc.js');
var fs = require('fs');

// ----------------------------------------------------------------------------

// // Train VAE

// var ret = runModel({
// 	model: 'vae',
// 	modelLearnType: 'ML_reg',
// 	optimize_verbose: true,
// 	optimize_logProgress: true,
// 	optimize_logProgressFilename: __dirname + '/output/vae_elboProgress_z20.csv',
// 	optimize_checkpointParams: true,
// 	optimize_checkpointParamsFilename: __dirname + '/output/vae_params_z20.json',
// 	optimize_checkpointParamsThrottle: 30000,
// 	zDim: 20
// });

// ----------------------------------------------------------------------------

// Model specific returns for VAE

var ret = runModel({
	model: 'vae',
	modelLearnType: 'ML_reg',
	loadParams: __dirname + '/output/vae_params_z20.json',
	doCustomReturns: true,
	zDim: 20,

	vae_encodeDecodeTargetIndices: [7815, 3940, 4242, 3709]
});

if (ret.vaeSamples) {
	misc.saveTensorsToGrayscaleImages(ret.vaeSamples, 28, 28, __dirname + '/output/vae_sample');
}

if (ret.vaeEncodeDecodeSamples) {
	ret.vaeEncodeDecodeSamples.forEach(function(targetGroup, i) {
		misc.saveTensorToGrayscaleImage(targetGroup.target, 28, 28,
			__dirname + '/output/vae_encodeDecode_target_' + misc.zeropad(i, 3) + '_(id=' + targetGroup.index + ').png', function() {
				misc.saveTensorsToGrayscaleImages(targetGroup.reconstructions, 28, 28,
					__dirname + '/output/vae_encodeDecode_target_' + misc.zeropad(i, 3) + '_sample');
			});
	});
}

if (ret.vaeLatentCodes) {
	var file = fs.openSync(__dirname + '/output/vae_latentCodes.csv', 'w');
	var dummy = ret.vaeLatentCodes[0].code;
	var header = ['id'].concat(Object.keys(dummy.data));
	fs.writeSync(file, header.toString() + '\n');
	ret.vaeLatentCodes.forEach(function(datum) {
		var row = [datum.id].concat(datum.code.toFlatArray());
		fs.writeSync(file, row.toString() + '\n');
	});
	fs.closeSync(file);
}