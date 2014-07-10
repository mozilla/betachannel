/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');

var AWS = require('aws-sdk');
var uuid = require('node-uuid').v4;

var utils = require('../../lib/utils');

var config;

// aws/icon.js does the most init heavy lifting
exports.init = function(aConfig) {
  config = aConfig;
};

exports.save = function(signedPackage, cb) {

  fs.readFile(signedPackage, {
    binary: true
  }, function(err, zipData) {
    if (err) return cb(err);

    var filename = uuid() + '.zip';

    var s3 = new AWS.S3();
    var params = {
      Bucket: config.awsS3PublicBucket,
      Key: filename,
      Body: zipData,
      ACL: 'public-read'
    };
    s3.putObject(params, function(err, data) {
      cb(err, filename);
    });
  });
};

exports.load = function(s3Item, cb) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: config.awsS3PublicBucket,
    Key: s3Item
  };
  s3.getObject(params, function(err, data) {
    if (err || !data.Body) {
      console.log(err.stack || err);
      cb(err);
    } else {
      cb(null, data.Body);
    }
  });
};

exports.delete = function(version, cb) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: config.awsS3PublicBucket,
    Key: version.signed_package_location
  };
  s3.deleteObject(params, function(err, data) {
    if (err) console.log(err.stack || err);
    cb(null);
  });
};
