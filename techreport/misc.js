var jimp = require('jimp');
var fs = require('fs');

function zeropad(num, numZeros) {
	var numStr = num.toString();
	var numLength = numStr.length;
	var zerosNeeded = Math.max(numZeros - numLength, 0);
	for (var i = 0; i < zerosNeeded; i++) {
		numStr = '0' + numStr;
	}
	return numStr;
}

function saveTensorToGrayscaleImage(tensor, w, h, filename, cb) {
	tensor = tensor.clone();
	tensor.reshape([h, w]);
	var img = new jimp(w, h);
	img.scan(0, 0, w, h, function(x, y, idx) {
		var val = tensor.data[y*w + x];
		var quantval = Math.floor(255*val);
		this.bitmap.data[idx] = quantval;
		this.bitmap.data[idx+1] = quantval;
		this.bitmap.data[idx+2] = quantval;
		this.bitmap.data[idx+3] = 255;
	});
	img.write(filename, cb);
}

function saveTensorsToGrayscaleImages(tensors, w, h, basename, cb) {
	var i = 0;
	function saveImageLoop() {
		if (i < tensors.length) {
			var tensor = tensors[i];
			i++;
			saveTensorToGrayscaleImage(tensor, 28, 28,
				basename + '_' + zeropad(i, 3) + '.png',
				saveImageLoop);
		}
	}
	saveImageLoop();
	if (cb) cb();
}

// Fix a saved param file that didn't get its Float64Arrays converted to normal arrays before
//    serialization.
function fixSavedParams(filename, outFilename) {
	var params = JSON.parse(fs.readFileSync(filename, 'utf-8'));
	for (var name in params) {
		var lst = params[name];
		lst.forEach(function(tensor) {
			var dataKeys = Object.keys(tensor.data); dataKeys.sort();
			var data = dataKeys.map(function(key) {
				return tensor.data[key];
			});
			tensor.data = data;
		});
	}
	fs.writeFileSync(outFilename, JSON.stringify(params));
}


module.exports = {
	zeropad: zeropad,
	saveTensorToGrayscaleImage: saveTensorToGrayscaleImage,
	saveTensorsToGrayscaleImages: saveTensorsToGrayscaleImages,
	fixSavedParams: fixSavedParams
}