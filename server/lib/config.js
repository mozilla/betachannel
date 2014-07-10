/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Module determines application configuraiton based on
 * the `CONFIG_FILES` environment variable.
 * Module exports one function which takes a callback.
 * Callback will have one argument, the config values.
 * If there is an error loading configuration, an
 * exception will be thrown.
 */
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var vm = require('vm');

var context = vm.createContext();
var initialized = false;

function env( /* key */ ) {
  var i = 0,
    max = arguments.length,
    value;
  for (; i < max; i++) {
    value = process.env[arguments[i]];
    if (value) {
      return value;
    }
  }
}

exports.init = function(argv) {
  initialized = true;
  var configPaths = argv['config-files'].split(',');
  configPaths.forEach(function(configPath) {
    var configFile;
    if (fs.existsSync(configPath)) {
      configFile = configPath;
    } else {
      configFile = path.join(process.cwd(), configPath);
    }
    if (fs.existsSync(configPath)) {
      vm.runInContext(fs.readFileSync(configFile), context, configFile);
    }
  });

  // Cascade config overwrites
  context.buildDir = argv.buildDir ||
    env("FILESYSTEM_BUILD") ||
    context.buildDir;

  if (!context.buildDir) {
    throw new Error("Must specify a build directory");
  }

  if ( !! context.buildDir) {
    context.buildDir = path.resolve(process.cwd(), context.buildDir);
  }

  context.cacheDir = argv.cacheDir ||
    env("FILESYSTEM_CACHE") ||
    context.cacheDir ||
    path.resolve(__dirname, "..", "cache");

  if ( !! context.cacheDir) {
    context.cacheDir = path.resolve(process.cwd(), context.cacheDir);
  }

  // Issue #11
  context.keysDir = path.resolve(context.cacheDir, 'keys');

  context.force = argv.force || context.force;

  context.bind_address =
    env('BIND_ADDRESS') ||
    context.bind_address;

  context.controller_server_port = argv['controller-port'] ||
    env("CONTROLLER_SERVER_PORT") ||
    context.controller_server_port;

  context.generator_endpoint = argv['generator-endpoint'] ||
    env("GENERATOR_ENDPOINT") ||
    context.generator_endpoint;

  context.generator_server_port = argv['generator-port'] ||
    env("GENERATOR_SERVER_PORT") ||
    context.generator_server_port;

  context.awsAccessKeyId = argv['aws-access-key-id'] ||
    env("AWS_ACCESS_KEY_ID") ||
    context.awsAccessKeyId;

  context.awsSecretAccessKey = argv['aws-secret-access-key'] ||
    env("AWS_SECRET_ACCESS_KEY") ||
    context.awsSecretAccessKey;

  context.varPath = path.resolve(process.cwd(), (context.varPath));

  var baseDir = path.join(__dirname, '..');

  var certsDir;
  if (!context.certificateStorage) {
    throw new Error('certificateStorage must be setup for either S3 or local disk');
  }
  if ( !! context.certificateStorage.local) {
    certsDir = path.resolve(process.cwd(), context.certificateStorage.local);
  } else {
    certsDir = path.resolve(process.cwd(), context.certificateStorage.localCertsDir);
  }
  context.configCertsDir = certsDir;
  context.derFilePath = path.join(certsDir, 'betafox.der');


  ['binPath', 'configCertsDir', 'derFilePath'].forEach(function(key) {
    context[key] =
      path.resolve(baseDir, context[key]);
  });

  context.logFile = path.resolve(process.cwd(), context.logFile);
  fse.mkdirp(path.dirname(context.logFile));
  fs.close(fs.openSync(context.logFile, 'a'));

  // TODO Support this flag (CLI only?)
  context.debug = false;
};

exports.withConfig = function(cb) {
  if (false === initialized) {
    throw new Error('you must initialize config before using');
  } else {
    return cb(context);
  }
};
