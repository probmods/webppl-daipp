// Harness for running a model
// (This reproduces some boilerplate from webppl/webppl.js, which IMO really ought to be
//    better abstracted...)

// ----------------------------------------------------------------------------

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

// The environment variable WEBPPL_ROOT must be defined, so we know where to find 
//    the webppl src/ directory.
var WEBPPL_ROOT = process.env.WEBPPL_ROOT;
assert(WEBPPL_ROOT, 'Environment variable WEBPPL_ROOT must be defined.');

var webppl = require(WEBPPL_ROOT + '/src/main');
var pkg = require(WEBPPL_ROOT + '/src/pkg');
var errors = require(WEBPPL_ROOT + '/src/errors/errors');
var parseV8 = require(WEBPPL_ROOT + '/src/errors/parsers').parseV8;
var showError = require(WEBPPL_ROOT + '/src/errors/node').showError;

// ----------------------------------------------------------------------------

function mergeDefaults(options, defaults) {
  return _.defaults(options ? _.clone(options) : {}, defaults);
}

// ----------------------------------------------------------------------------

// We cache the header and footer code, so we only go to disk to load those once.
var headerCode;
var footerCode;

function compileModel(opts) {
	opts = mergeDefaults(opts, {
		// WebPPL runtime stuff
		webppl_verbose: false,
		webppl_debug: true,
		webppl_packages: [],

		// Data stuff
		// If model provides targetModel: how many training/test data points to generate
		nGenTrainingData: 100,
		nGenTestData: 100,
		// If model provides training/test data, can still optionally limit the amount of that
		//    data to use
		nTrainingData: undefined,
		nTestData: undefined,
		// If model provides trainingData but not testData: What percentage of the data should
		//    be reserved as test data
		testSplit: 0.2,

		// Optimization stuff
		batchSize: undefined,
		optimize_nSteps: 100,
		optimize_optMethod: { adam: { stepSize: 0.1 } },
		optimize_estimator: { ELBO2: { samples: 1 } },
		optimize_verbose: false,
		optimize_logProgress: false,
		optimize_logProgressThrottle: undefined,
		optimize_logProgressFilename: undefined,
		optimize_checkpointParams: false,
		optimize_checkpointParamsThrottle: undefined,
		optimize_checkpointParamsFilename: undefined,

		// Evaluation stuff
		doCustomReturns: false,
		doDataLogProb: false,
		doGuideESS: false,
		dataLogProb_nSamples: 100,
		dataLogProb_useGuide: true,
		ess_nDataPoints: 100,
		ess_nParticles: 100,
		ess_requireGuides: true,

		// Turn model learning on/off
		doModelLearning: true,
		// Can be 'ML', 'ML_reg', 'VB',
		modelLearnType: 'ML_reg',
		// Can be 'MeanField', 'Recognition' (TODO: also auto recognition guide, eventually)
		localGuideType: 'Recognition'		
	});

	var model = opts.model;
	assert(model, 'Must provide a model to run.');

	// Load header and footer code, if we haven't already
	if (headerCode === undefined) {
		headerCode = fs.readFileSync(__dirname + '/header.wppl');
		footerCode = fs.readFileSync(__dirname + '/footer.wppl');
	}

	// Load model code, prepend opts and header, append footer
	var modelCode = fs.readFileSync(__dirname + '/models/' + model + '.wppl');
	var code = 'var opts = ' + JSON.stringify(opts) + ';\n' +
				headerCode + '\n' +
				modelCode + '\n' +
				footerCode;

	// Put through webppl compile pipeline
	var packagePaths = [pkg.globalPkgDir()];
	var packageNames = opts.webppl_packages.concat(['.']);	// Assume running from root of 'webppl-daipp'
	var packages = packageNames.map(function(name_or_path) {
		return pkg.load(pkg.read(name_or_path, packagePaths, opts.webppl_verbose));
	});	
	packages.forEach(function(pkg) {
		if (pkg.js) { global[pkg.js.identifier] = require(pkg.js.path); }
		pkg.headers.forEach(webppl.requireHeader);
	});
	return webppl.compile(code, {
		bundles: webppl.parsePackageCode(packages, opts.webppl_verbose),
		verbose: opts.webppl_verbose,
		debug: opts.webppl_debug
	});
}

// We cache the compiled code so that if we ever see the exact same options object
//    again, we can re-use it. This is useful when re-running a random program
//    multiple times as part of an experiment.
var nextOptsID = 0;
function getID(opts) {
	if (!_.has(opts, '__uniqueID')) {
		opts.__uniqueID = nextOptsID;
		nextOptsID++;
	}
	return opts.__uniqueID;
}
var compiledCodeCache = {};
function getCompiledCode(opts) {
	var code = cache[getID(opts)];
	if (code === undefined) {
		code = compileModel(opts);
		cache[getID(opts)] = code;
	}
	return code;
}


function runModel(opts) {
	var code = getCompiledCode(opts);
	
	try {
		var retval;
		var topK = function(s, x) { retval = x; };
		webppl.prepare(code, topK).run();
		return retval;
	} catch (error) {
		if (error instanceof Error && error.wpplRuntimeError) {
			try {
		    	var stack = errors.recoverStack(error, parseV8);
		    	showError(error, stack, programFile, debug);
		    	process.exitCode = 1;
		  	} catch (e) {
		    	// If we fail to generate a readable error message re-throw
		    	// the original error.
		    	throw error;
		  	}
		} else {
			throw error;
		}
	}
}

// ----------------------------------------------------------------------------

module.exports = runModel;


