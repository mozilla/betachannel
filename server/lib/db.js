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
  dblib.init(config, cb);
};

exports.requireDriver = function(type, file) {
  if (config.awsAccessKeyId && config.awsAccessKeyId.length > 0) {
    return require(type + '/aws/' + file);
  } else {
    return require(type + '/mysql/' + file);
  }
};
