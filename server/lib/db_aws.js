/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var AWS = require('aws-sdk');

const VERSIONS = 'betafox-versions';
const VERSIONS_BY_APP_NAME = 'versions-by-appname';
const VERSIONS_BY_EMAIL = 'versions-by-email';

exports.init = function(config, cb) {
  AWS.config.update({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  });
  // TODO region
  AWS.config.update({
    region: 'us-west-1'
  });
  var dynamoDB = new AWS.DynamoDB();


  /*
  TODO: missing and nice to haves

  A list of all versions of an app
  A list of all apps for an Email address
  App Name, etc by appCode
  versionID as UUID makes for bad URLs

  Easy way to load the latest version of an app

  App Table
  appCode
  latestVersion
  listOfVersions
*/

  dynamoDB.describeTable({
    TableName: VERSIONS
  }, function(err, data) {
    if (err) {
      if ('ResourceNotFoundException' === err.code) {
        createVersionTable(dynamoDB, config, cb);
      } else {
        return cb(err);
      }
    } else {
      if ('ACTIVE' !== data.Table.TableStatus) {
        dynamoDB.waitFor('tableExists', {
          TableName: VERSIONS
        }, function(err, data) {
          cb(err, data);
        });
      } else {
        cb(err, data);
      }
    }
  });
};

function createVersionTable(dynamoDB, config, cb) {
  var params = {
    TableName: VERSIONS,
    AttributeDefinitions: [{
      // {email}-{escaped-app-name} - creator's email address for now
      AttributeName: 'appId',
      AttributeType: 'S'
    }, {
      // {appId}-{versionId} where versionId is a UUID
      AttributeName: 'versionId',
      AttributeType: 'S'
    }, {
      // email address
      AttributeName: 'createdBy',
      AttributeType: 'S'
    }],
    KeySchema: [ // required
      {
        AttributeName: 'versionId',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: config.dynamoReadCapacityUnits,
      WriteCapacityUnits: config.dynamoWriteCapacityUnits
    },
    GlobalSecondaryIndexes: [{
      IndexName: VERSIONS_BY_APP_NAME,
      KeySchema: [{
        AttributeName: 'appId',
        KeyType: 'HASH'
      }],
      Projection: {
        NonKeyAttributes: ['versionId', 'createdAt', 'manifest'], // manifest is need until we denormalize with App Table
        ProjectionType: 'INCLUDE'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: config.dynamoReadCapacityUnits,
        WriteCapacityUnits: config.dynamoWriteCapacityUnits,
      }
    }, {
      IndexName: VERSIONS_BY_EMAIL,
      KeySchema: [{
        AttributeName: 'createdBy',
        KeyType: 'HASH'
      }],
      Projection: {
        NonKeyAttributes: ['appId', 'versionId'],
        ProjectionType: 'INCLUDE'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: config.dynamoReadCapacityUnits,
        WriteCapacityUnits: config.dynamoWriteCapacityUnits,
      }
    }]
    //, LocalSecondaryIndexes: []
  };
  console.log('SETUP: Creating Table ' + VERSIONS);
  dynamoDB.createTable(params, function(err, data) {
    if (err) return cb(err);
    console.log('SETUP: Waiting for Table Creation to finish');
    dynamoDB.waitFor('tableExists', {
      TableName: VERSIONS
    }, function(err, data) {
      console.log('SETUP: Finished Creating ' + VERSIONS);
      if (err) console.log('Errors=', err);
      cb(err, data);
    });
  });
}

exports.deleteDB = function(cb) {
  var dynamoDB = new AWS.DynamoDB();
  dynamoDB.deleteTable({
    TableName: VERSIONS
  }, function(err, data) {
    if (err) return cb(err);
    dynamoDB.waitFor('tableNotExists', {
      TableName: VERSIONS
    }, function(err, data) {
      cb(err, data);
    });

  });
};

exports.VERSIONS = VERSIONS;
exports.VERSIONS_BY_APP_NAME = VERSIONS_BY_APP_NAME;
exports.VERSIONS_BY_EMAIL = VERSIONS_BY_EMAIL;
