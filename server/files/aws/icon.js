/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');

var AWS = require('aws-sdk');
var uuid = require('node-uuid').v4;

var config;

exports.init = function(aConfig) {
  if (!aConfig.awsS3PublicBucket) throw new Error('BAD CONFIG, missing awsS3PublicBucket');
  config = aConfig;

  AWS.config.update({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  });


  var params = {
    Bucket: config.awsS3PublicBucket, // required
    ACL: 'public-read',
    CreateBucketConfiguration: {
      LocationConstraint: 'us-west-1',
    }
  };
  var s3 = new AWS.S3();
  // 'http://{awsS3PublicBucket}.amazonaws.com/'
  s3.createBucket(params, function(err, data) {
    if (err && 'BucketAlreadyOwnedByYou' !== err.code) {
      throw new Error(err);
    } else {
      console.log('Created S3 Bucket');
    }
  });
};

exports.save = function(iconPath, cb) {

  fs.readFile(iconPath, {
    binary: true
  }, function(err, iconData) {
    if (err) return cb(err);

    var ext = path.extname(iconPath);
    var filename = uuid() + ext;

    var s3 = new AWS.S3();
    var params = {
      Bucket: config.awsS3PublicBucket,
      Key: filename,
      Body: iconData,
      ACL: 'public-read'
    };
    s3.putObject(params, function(err, data) {
      cb(err, filename);
    });
  });
};

exports.delete = function(version, cb) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: config.awsS3PublicBucket,
    Key: version.icon_location
  };
  s3.deleteObject(params, function(err, data) {
    if (err) console.log(err.stack || err);
    cb(null);
  });
};

exports.url = function(version) {
  //  ://s3-us-west-1.amazonaws.com/betafox-assets-dev/7d732961-47e8-497e-9959-1ea8a9755d70.jpg
  return 'https://s3-us-west-1.amazonaws.com/' + config.awsS3PublicBucket + '/' + version.icon_location;
};
