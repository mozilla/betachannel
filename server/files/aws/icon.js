/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');

var AWS = require('aws-sdk');
var log = require('winston');
var uuid = require('node-uuid').v4;

var config;

exports.init = function(aConfig) {
  if (!aConfig.awsS3PublicBucket) throw new Error('BAD CONFIG, missing awsS3PublicBucket');
  config = aConfig;

  AWS.config.update({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  });


  if (config.awsS3CreateBucket) {
    createBucket(config.awsS3PublicBucket, config.awsS3Region);
  }
};

function createBucket(bucket, region) {
  var params = {
    Bucket: bucket, // required
    ACL: 'public-read',
  };

  if (region != 'us-east-1') {
    params.CreateBucketConfiguration = {
      LocationConstraint: region,
    };
  }

  var s3 = new AWS.S3();
  // 'http://{awsS3PublicBucket}.amazonaws.com/'
  s3.createBucket(params, function(err, data) {
    if (err && 'BucketAlreadyOwnedByYou' !== err.code) {
      throw new Error(err);
    } else {
      log.error('Created S3 Bucket');
    }
  });
}

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

exports.load = function(s3Item, cb) {
  var s3 = new AWS.S3();
  var params = {
    Bucket: config.awsS3PublicBucket,
    Key: s3Item
  };
  s3.getObject(params, function(err, data) {
    if (err || !data.Body) {
      log.error(err.stack || err);
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
    Key: version.icon_location
  };
  s3.deleteObject(params, function(err, data) {
    if (err) log.error(err.stack || err);
    cb(null);
  });
};
