/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var async = require('async');
var AWS = require('aws-sdk');

var APPS;
var APPS_BY_APP_CODE;
var APPS_BY_CREATED_BY;
var VERSIONS;
var VERSIONS_BY_APP_NAME;
var VERSIONS_BY_EMAIL;


exports.init = function(config, cb) {
  AWS.config.update({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  });

  // TODO region
  AWS.config.update({
    region: 'us-west-1'
  });

  module.exports.APPS = APPS = config.dynamodbTablePrefix + 'apps';
  APPS_BY_APP_CODE;
  module.exports.APPS_BY_APP_CODE = APPS_BY_APP_CODE = 'apps-by-app-code';
  module.exports.APPS_BY_CREATED_BY = APPS_BY_CREATED_BY = 'apps-by-created-by';

  module.exports.VERSIONS = VERSIONS = config.dynamodbTablePrefix + 'versions';
  module.exports.VERSIONS_BY_APP_NAME = VERSIONS_BY_APP_NAME = 'versions-by-appname';
  module.exports.VERSIONS_BY_EMAIL = VERSIONS_BY_EMAIL = 'versions-by-email';

  var dynamoDB = new AWS.DynamoDB();

  async.parallel([

    function(checkCb) {
      dynamoDB.describeTable({
        TableName: VERSIONS
      }, function(err, data) {
        if (err) {
          if ('ResourceNotFoundException' === err.code) {
            createVersionTable(dynamoDB, config, checkCb);
          } else {
            return checkCb(err);
          }
        } else {
          if ('ACTIVE' !== data.Table.TableStatus) {
            dynamoDB.waitFor('tableExists', {
              TableName: VERSIONS
            }, function(err, data) {
              checkCb(err, data);
            });
          } else {
            checkCb(err, data);
          }
        }
      });
    },
    function(checkCb) {
      dynamoDB.describeTable({
        TableName: APPS
      }, function(err, data) {
        if (err) {
          if ('ResourceNotFoundException' === err.code) {
            createAppTable(dynamoDB, config, checkCb);
          } else {
            return checkCb(err);
          }
        } else {
          if ('ACTIVE' !== data.Table.TableStatus) {
            dynamoDB.waitFor('tableExists', {
              TableName: APP
            }, function(err, data) {
              checkCb(err, data);
            });
          } else {
            checkCb(err, data);
          }
        }
      });
    }
  ], function(err) {
    cb(err);
  });
};

function createAppTable(dynamoDB, config, cb) {
  var params = {
    TableName: APPS,
    AttributeDefinitions: [{
      // UUID
      AttributeName: 'appId',
      AttributeType: 'S'
    }, {
      // {appId}-{versionId} where versionId is a UUID
      AttributeName: 'appCode',
      AttributeType: 'S'
    }, {
      // email address
      AttributeName: 'createdBy',
      AttributeType: 'S'
    }],
    KeySchema: [ // required
      {
        AttributeName: 'appId',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: config.dynamoReadCapacityUnits,
      WriteCapacityUnits: config.dynamoWriteCapacityUnits
    },
    GlobalSecondaryIndexes: [{
      IndexName: APPS_BY_APP_CODE,
      KeySchema: [{
        AttributeName: 'appCode',
        KeyType: 'HASH'
      }],
      Projection: {
        NonKeyAttributes: ['appId', 'createdAt', 'latestVersion', 'latestVersionId', 'versionList', 'name'],
        ProjectionType: 'INCLUDE'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: config.dynamoReadCapacityUnits,
        WriteCapacityUnits: config.dynamoWriteCapacityUnits,
      }
    }, {
      IndexName: APPS_BY_CREATED_BY,
      KeySchema: [{
        AttributeName: 'createdBy',
        KeyType: 'HASH'
      }],
      Projection: {
        NonKeyAttributes: ['appId', 'appCode', 'createdAt', 'name'],
        ProjectionType: 'INCLUDE'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: config.dynamoReadCapacityUnits,
        WriteCapacityUnits: config.dynamoWriteCapacityUnits,
      }
    }]
  };
  console.log('SETUP: Creating Table ' + APPS);
  dynamoDB.createTable(params, function(err, data) {
    if (err) return cb(err);
    console.log('SETUP: Waiting for Table Creation to finish');
    dynamoDB.waitFor('tableExists', {
      TableName: APPS
    }, function(err, data) {
      console.log('SETUP: Finished Creating ' + APPS);
      if (err) console.log('Errors=', err);
      cb(err, data);
    });
  });
}

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
  async.parallel([

    function(delCb) {
      dynamoDB.deleteTable({
        TableName: VERSIONS
      }, function(err, data) {
        if (err) return cb(err);
        dynamoDB.waitFor('tableNotExists', {
          TableName: VERSIONS
        }, function(err, data) {
          delCb(err, data);
        });
      });
    },
    function(delCb) {
      dynamoDB.deleteTable({
        TableName: APPS
      }, function(err, data) {
        if (err) return cb(err);
        dynamoDB.waitFor('tableNotExists', {
          TableName: APPS
        }, function(err, data) {
          delCb(err, data);
        });
      });
    }
  ], function(err) {
    cb(err);
  });
};
