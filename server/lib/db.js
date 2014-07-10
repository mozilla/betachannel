/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var log = require('winston');

var config;
var dblib;

exports.init = function(aConfig, cb) {
  config = aConfig;
  if (config.dynamodbTablePrefix && config.dynamodbTablePrefix.length > 0) {
    dblib = require('./db_aws');
  } else if (config.mysql &&
    config.mysql.user && config.mysql.user.length > 0) {
    dblib = require('./db_mysql');
  } else {
    throw new Error('No DB configuration found - expected DynamoDB or MySQL');
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
  if (-1 !== type.indexOf('models') &&
    config.dynamodbTablePrefix && config.dynamodbTablePrefix.length > 0) {
    if (false === loggedMode) {
      loggedMode = true;
      log.error('Deploying with DynamoDB');
    }
    return require(type + '/aws/' + file);
  } else if (-1 !== type.indexOf('models')) {
    if (false === loggedMode) {
      loggedMode = true;
      log.error('Deploying with MySQL');
    }
    return require(type + '/mysql/' + file);
  } else if (-1 !== type.indexOf('files') &&
    config.awsS3PublicBucket && config.awsS3PublicBucket.length > 0) {
    return require(type + '/aws/' + file);
  } else if (-1 !== type.indexOf('files') &&
    config.fileStoragePath && config.fileStoragePath.length > 0) {
    return require(type + '/disk/' + file);
  } else {
    throw new Error('requireDriver for unknown type/file pair type=' +
      type + ' file=' + file);
  }
};
