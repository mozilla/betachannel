/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var config;
var dblib;

exports.init = function(aConfig, cb) {
  config = aConfig;
  if (config.awsAccessKeyId && config.awsAccessKeyId.length > 0) {
    dblib = require('./db_aws');
  } else if (config.mysql &&
    config.mysql.user && config.mysql.user.length > 0) {
    dblib = require('./db_mysql');
  } else {
    throw new Error('No DB configuration found - expected AWS or MySQL');
  }

  exports.requireDriver('../files', 'icon').init(config);
  exports.requireDriver('../files', 'packaged').init(config);

  dblib.init(config, cb);

};

var loggedMode = false;
/**
 * This server can be run in Cloud mode and it gets modules under the
 * 'aws' direcoty. These work with DynamoDB and S3.
 * Or it can be run in Enterprise mode and it gets modules under either
 * 'mysql' and 'disk' depending on if they are 'models' or 'files'
 */
exports.requireDriver = function(type, file) {
  if (config.awsAccessKeyId && config.awsAccessKeyId.length > 0) {
    if (false === loggedMode) {
      loggedMode = true;
      console.log('Deploying in Cloud mode');
    }
    return require(type + '/aws/' + file);
  } else if (-1 !== type.indexOf('models')) {
    if (false === loggedMode) {
      loggedMode = true;
      console.log('Deploying in Enterprise mode');
    }
    return require(type + '/mysql/' + file);
  } else {
    return require(type + '/disk/' + file);
  }
};
