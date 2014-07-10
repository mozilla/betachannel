/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');

var _ = require('underscore');
var async = require('async');
var AWS = require('aws-sdk');
var log = require('winston');
var rmrf = require('fs-extra').remove;
var tmp = require('tmp');
var uuid = require('node-uuid').v4;

var publishKeys = require('./publish_keys');
var unzip = require('./unzip');
var zip = require('./zip');

var config;

exports.init = function(aConfig, cb) {
  config = aConfig;
  if (usingS3()) {
    if (!config.certificateStorage.awsS3PrivateBucket) throw new Error('BAD CONFIG, missing awsS3PrivateBucket');

    AWS.config.update({
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey
    });

    if (config.certificateStorage && !! config.certificateStorage.awsS3PrivateBucket) {
      createBucket(config.certificateStorage.awsS3PrivateBucket,
        config.awsS3Region, cb);
    }
  } else {
    cb(null);
  }
};

function createBucket(bucket, region, cb) {
  var params = {
    Bucket: bucket, // required
    ACL: 'private',
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
      cb(err);
    } else {
      log.error('Created S3 Bucket');
      cb(null);
    }
  });
}

exports.usingS3 = usingS3 = function() {
  return config.certificateStorage && !! config.certificateStorage.awsS3PrivateBucket;
}

exports.exists = function(cb) {
  if (usingS3()) {
    module.exports.getFromS3(cb);
  } else {
    module.exports.getFromLocalDisk(cb);
  }
};

/**
 *
 * TODO retries
 */
exports.getFromS3 = function(cb) {
  var key = config.certificateStorage.awsS3ItemPrefix + 'certdb.zip';
  var params = {
    Bucket: config.certificateStorage.awsS3PrivateBucket,
    Key: key
  };
  var s3 = new AWS.S3();
  s3.getObject(params, function(err, data) {
    if (err &&
      'NoSuchKey' === err.code) {
      cb(null, false);
    } else if (err) {
      return cb(err);
    } else {
      tmp.file(function(err, zipPath, fd) {
        if (err) return cb(err);

        fs.writeFile(zipPath + '.zip', data.Body, {
          encoding: null
        }, function(err) {
          if (err) return cb(err);

          unzip(zipPath, config.configCertsDir, function(err) {
            if (err) return cb(err);
            publishKeys(config);
            cb(null, true);
          });
        });
      });
    }
  });
};

/**
 *
 */
exports.getFromLocalDisk = function(cb) {
  var localStorage = config.certificateStorage.local;
  async.parallel([

    function(pCb) {

      fs.exists(path.join(localStorage, 'password.txt'), function(exists) {
        pCb(null, exists);
      });
    },
    function(pCb) {
      fs.exists(path.join(localStorage, 'trusted', 'ca1.der'), function(exists) {
        pCb(null, exists);
      });
    },
    function(pCb) {
      fs.exists(path.join(localStorage, 'trusted', 'cert8.db'), function(exists) {
        pCb(null, exists);
      });

    },
    function(pCb) {
      fs.exists(path.join(localStorage, 'trusted', 'ee1.der'), function(exists) {
        pCb(null, exists);
      });

    },
    function(pCb) {
      fs.exists(path.join(localStorage, 'trusted', 'key3.db'), function(exists) {
        pCb(null, exists);
      });

    },
    function(pCb) {
      fs.exists(path.join(localStorage, 'trusted', 'secmod.db'), function(exists) {
        pCb(null, exists);
      });
    }
  ], function(err, results) {
    if (err) return cb(err);
    cb(null, _.reduce(results, function(memo, val) {
      return memo && val;
    }, true));
  });
}

/**
 * If we're using S3, copy bits offsite.
 * These will be the canonical copy.
 * TODO what happens if you switch between S3 and localDisk?
 */
exports.backupRemotely = function() {
  if (false === usingS3()) return;
  zip(config.configCertsDir, function(err, zipPath) {
    if (err) return log.error(err);

    var s3 = new AWS.S3();
    fs.readFile(zipPath, {
      encoding: null
    }, function(err, data) {
      if (err) throw new Error(err);
      var params = {
        Bucket: config.certificateStorage.awsS3PrivateBucket,
        Key: config.certificateStorage.awsS3ItemPrefix + 'certdb.zip',
        Body: data,
        ACL: 'private'
      };
      s3.putObject(params, function(err, data) {
        if (err) {
          log.error('Error backing up cert DB', err);
        }
      });
    });
  });
};

exports.delete = function(cb) {
  if (usingS3()) {
    var s3 = new AWS.S3();
    var params = {
      Bucket: config.certificateStorage.awsS3PrivateBucket,
      Key: config.certificateStorage.awsS3ItemPrefix + 'certdb.zip'
    };
    s3.deleteObject(params, function(err, data) {
      if (err) log.error(err.stack || err);
      cb(null);
    });
  } else {
    log.error('Removing', config.certificateStorage.local);
    rmrf(config.certificateStorage.local, function(err) {
      cb(err);
    });
  }
};

exports.url = function(version) {
  //  ://s3-us-west-1.amazonaws.com/betafox-assets-dev/7d732961-47e8-497e-9959-1ea8a9755d70.jpg
  return 'https://s3-' + config.awsS3Region + '.amazonaws.com/' + config.awsS3PublicBucket + '/' + version.icon_location;
};
