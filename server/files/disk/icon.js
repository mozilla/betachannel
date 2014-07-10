/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');

var uuid = require('node-uuid').v4;

var utils = require('../../lib/utils');

var config;

exports.init = function(aConfig) {
  if (!aConfig.fileStoragePath) throw new Error('BAD CONFIG, missing fileStoragePath');
  config = aConfig;
  fs.mkdir(aConfig.fileStoragePath, function(err) {
    fs.mkdir(path.join(aConfig.fileStoragePath, 'app-icons'));
  });
};

exports.save = function(iconPath, cb) {
  var ext = path.extname(iconPath);
  var filename = uuid() + ext;
  var dest = path.join(config.fileStoragePath, 'app-icons', filename);
  utils.copyFile(iconPath, dest, function(err) {
    cb(err, dest);
  });
};

exports.load = function(iconPath, cb) {
  fs.readFile(iconPath, {
        encoding: null
      }, cb);
};

exports.delete = function(version, cb) {
  fs.unlink(version.icon_location, function(err) {
    if (err) console.log(err.stack || err);
    cb(null);
  });
};
