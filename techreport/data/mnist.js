'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var _ = require('underscore');

// Download and gunzip training and test sets from:
// http://yann.lecun.com/exdb/mnist/

// JSON output written to current directory.

if (process.argv.length < 3) {
  console.log('Usage: node mnist path_to_mnist_dataset');
  process.exit();
}

var baseDir = process.argv[2];

var trainImagesFilename = 'train-images-idx3-ubyte';
var trainLabelsFilename = 'train-labels-idx1-ubyte';
var testImagesFilename = 't10k-images-idx3-ubyte';
var testLabelsFilename = 't10k-labels-idx1-ubyte';

var loadImages = function(fn, nImages) {
  var buff = fs.readFileSync(fn);

  assert.strictEqual(buff.readUInt32BE(0), 2051);
  assert.strictEqual(buff.readUInt32BE(4), nImages);
  assert.strictEqual(buff.readUInt32BE(8), 28);
  assert.strictEqual(buff.readUInt32BE(12), 28);

  var offset = 16;
  var images = [];

  for (var i = 0; i < nImages; i++) {
    var image = [];
    for (var j = 0; j < 784; j++) {
      var pixelIntensity = buff[offset + (i * 784) + j];
      // Make binary.
      image.push(pixelIntensity < 128 ? 0 : 1);
    }
    images.push(image);
  }

  return images;
};

var loadLabels = function(fn, nLabels) {
  var buff = fs.readFileSync(fn);

  assert.strictEqual(buff.readUInt32BE(0), 2049);
  assert.strictEqual(buff.readUInt32BE(4), nLabels);

  var offset = 8;
  var labels = [];

  for (var i = 0; i < nLabels; i++) {
    labels.push(buff[offset + i]);
  }

  return labels;
};

var showImage = function(image) {
  for (var k = 0; k < 28; k++) {
    console.log(image.slice(k * 28, (k + 1) * 28)
                .join('')
                .replace(/0/g, ' ')
                .replace(/1/g, '*'));
  }
};

// Train
var images_train = loadImages(path.join(baseDir, trainImagesFilename), 60000);
fs.writeFileSync('mnist_images_train.json', JSON.stringify(images_train));
var labels_train = loadLabels(path.join(baseDir, trainLabelsFilename), 60000);
fs.writeFileSync('mnist_labels_train.json', JSON.stringify(labels_train));

// Test
var images_test = loadImages(path.join(baseDir, testImagesFilename), 10000);
fs.writeFileSync('mnist_images_test.json', JSON.stringify(images_test));
var labels_test = loadLabels(path.join(baseDir, testLabelsFilename), 10000);
fs.writeFileSync('mnist_labels_test.json', JSON.stringify(labels_test));
