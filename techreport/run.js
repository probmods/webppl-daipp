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

var headerCode;
var footerCode;

function run(opts) {

	var runOpts = opts.runOpts;
	var programOpts = opts.programOpts;

	// Merge defaults for options
	runOpts = mergeDefaults(runOpts, {
		verbose: false,
		debug: true,
		packages: [],
		saveCode: false		// Can be a filename to output the complete code
	});
	programOpts = mergeDefaults(programOpts, {
		// If the model provides a true data-generating model, how many data points to generate
		nData: 200,
		// What percentage of the data should be reserved as test data
		testSplit: 0.5,

		// Parameters to be given to Optimize
		optimize_nSteps: 100,
		optimize_optMethod: { adam: { stepSize: 0.1 } },
		optimize_estimator: { ELBO2: { samples: 1 } },
		optimize_verbose: false,
		optimize_logProgress: 200,

		// Evaluation stuff
		doDataLogProb: true,
		doGuideESS: true,
		doELBOProgress: true,
		dataLogProb_nSamples: 100,
		ess_nDataPoints: 100,
		ess_nParticles: 100,

		// Turn model learning on/off
		doModelLearning: true,
		// Can be 'ML', 'ML_reg', 'MeanField',
		modelLearnType: 'ML_reg',
		// Can be 'MeanField', 'Recognition' (TODO: auto recognition guide, eventually)
		localGuideType: 'Recognition'		
	});

	var model = programOpts.model;
	assert(model, 'Must provide a model to run.');

	// Load header and footer code, if we haven't already
	if (headerCode === undefined) {
		headerCode = fs.readFileSync(__dirname + '/header.wppl');
		footerCode = fs.readFileSync(__dirname + '/footer.wppl');
	}

	// Load model code, prepend opts and header, append footer
	var modelCode = fs.readFileSync(__dirname + '/models/' + model + '.wppl');
	var code = 'var opts = ' + JSON.stringify(programOpts) + ';\n' +
				headerCode + '\n' +
				modelCode + '\n' +
				footerCode;

	if (runOpts.saveCode) {
		fs.writeFileSync(runOpts.saveCode, code);
	}

	// Put through webppl run pipeline
	var packagePaths = [pkg.globalPkgDir()];
	var packageNames = runOpts.packages.concat(['.']);	// Assume running from root of 'webppl-daipp'
	var packages = packageNames.map(function(name_or_path) {
		return pkg.load(pkg.read(name_or_path, packagePaths, runOpts.verbose));
	});	
	packages.forEach(function(pkg) {
		if (pkg.js) { global[pkg.js.identifier] = require(pkg.js.path); }
		pkg.headers.forEach(webppl.requireHeader);
	});
	try {
		var retval;
		var topK = function(s, x) { retval = x; };
		webppl.run(code, topK, {
			bundles: webppl.parsePackageCode(packages, runOpts.verbose),
			verbose: runOpts.verbose,
			debug: runOpts.debug
		});
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

module.exports = run;


