/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var AWS = require('aws-sdk');
var uuid = require('node-uuid').v4;

var User = require('./user').User;
var appModel = require('./app'); // Node module isn't fully loaded yet

var VERSIONS = require('../../lib/db_aws').VERSIONS;
var VERSIONS_BY_APP_NAME = require('../../lib/db_aws').VERSIONS_BY_APP_NAME;

exports.Version = function(app, version) {
  this.app = app;
  this.version = version;
};

exports.Version.prototype.updateSize = function(id, aSize) {
  if (!id) {
    throw new Error('updateSize must include a versionId!');
  }
  if ('number' !== typeof aSize) {
    throw new Error('updateSize must include a size!');
  }
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: VERSIONS,
    Key: {
      versionId: {
        S: id
      }
    },
    AttributeUpdates: {
      signedPackageSize: {
        Action: 'PUT',
        Value: {
          N: aSize + ''
        }
      }
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
    ReturnValues: 'ALL_NEW'
  };
  dynamoDB.updateItem(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    }
  });
};

// TODO is findOne actually used?
exports.findOne = function(app, version, cb) {

};

exports.create = function(app, versionData, cb) {
  var versionId = uuid();
  var createdAt = new Date().getTime();

  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: VERSIONS,
    Item: {
      versionId: {
        S: versionId
      },
      createdBy: {
        S: app.user.email
      },
      appId: {
        S: app.code
      },

      manifest: {
        S: JSON.stringify(versionData.manifest)
      },
      iconLocation: {
        S: versionData.iconLocation
      },
      signedPackagePath: {
        S: versionData.signedPackagePath
      },
      signedPackageSize: {
        N: versionData.signedPackageSize + ''
      },
      createdAt: {
        N: createdAt + ''
      },
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
    ReturnValues: 'NONE'
  };
  dynamoDB.putItem(params, function(err, data) {
    if (err) return cb(err);

    // It's a PITA to get data back with putItem (?),
    // so we'll just create the object here.
    var aVersion = new exports.Version(app, versionData.manifest.version);
    aVersion.id = versionId; // TODO unify mysql and DynamoDB here
    aVersion.versionId = versionId;
    aVersion.manifest = versionData.manifest;

    aVersion.appId = app.code;
    aVersion.createdBy = app.user.email;

    aVersion.icon_location = versionData.iconLocation;
    aVersion.signed_package_path = versionData.signedPackagePath;
    aVersion.signed_package_size = versionData.signedPackageSize;
    aVersion.createdAt = createdAt;
    cb(err, aVersion);
  });
};

exports.loadByVersion = function(app, version, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: VERSIONS,
    Key: {
      versionId: {
        S: version
      }
    },
    ConsistentRead: false,
    ReturnConsumedCapacity: 'NONE'
  };
  dynamoDB.getItem(params, function(err, data) {
    if (err) return cb(err.stack || err);

    if (data.Item) {
      var aUser = new User(app.user.email);
      try {
        var manifest = JSON.parse(data.Item.manifest.S);
        var anApp = new appModel.App(aUser, manifest);
        var aVersion = new exports.Version(anApp, manifest.version);
        populate(aVersion, manifest, data.Item);
        cb(err, aVersion);
      } catch (e) {
        return cb(e);
      }
    } else {
      cb(err, null);
    }
  });
};

exports.latestVersionForApp = function(app, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: VERSIONS,
    IndexName: VERSIONS_BY_APP_NAME,
    AttributesToGet: ['versionId', 'appId', 'manifest', 'createdAt'],
    Select: 'SPECIFIC_ATTRIBUTES',
    KeyConditions: {
      appId: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{
          S: app.code
        }]
      }
    }
  };
  dynamoDB.query(params, function(err, data) {
    if (err) return cb(err);

    if (data.Count > 0) {

      // TODO this isn't very efficient
      var latest = 0;
      for (var i = 1; i < data.Count; i++) {
        var latestTime = parseInt(data.Items[latest].createdAt, 10);
        var curTime = parseInt(data.Items[i].createdAt, 10);
        if (latestTime < curTime) {
          latest = i;
        }
      }
      return exports.loadByVersion(app, data.Items[latest].versionId.S, cb);
    } else {
      cb(err, null);
    }
  });
};

// TODO: version number - from system or from the manifest.version?
// Probably from the system
// TODO make versionId nicer than UUID?
// or
// Support short codes?
exports.versionList = function(app, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: VERSIONS,
    IndexName: VERSIONS_BY_APP_NAME,
    AttributesToGet: ['versionId', 'appId', 'manifest', 'createdAt'],
    Select: 'SPECIFIC_ATTRIBUTES',
    KeyConditions: {
      appId: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{
          S: app.code
        }]
      }
    }
  };
  dynamoDB.query(params, function(err, data) {
    if (!err && data.Count > 0) {
      var versionList = [];
      for (var i = 0; i < data.Count; i++) {
        versionList.push(data.Items[i].versionId.S);
      }
      cb(err, versionList);
    } else {
      cb(err, []);
    }
  });
};

function populate(aVersion, manifest, dynData) {
  aVersion.manifest = manifest;

  aVersion.versionId = dynData.versionId.S;
  aVersion.id = dynData.versionId.S;
  aVersion.appId = dynData.appId.S;
  if (dynData.createdBy) {
    aVersion.createdBy = dynData.createdBy.S;
  }
  if (dynData.iconLocation) {
    aVersion.icon_location = dynData.iconLocation.S;
  }
  if (dynData.signedPackagePath) {
    aVersion.signed_package_path = dynData.signedPackagePath.S;
  }
  if (dynData.signedPackageSize) {
    aVersion.signed_package_size = parseInt(dynData.signedPackageSize.N, 10);
  }
  if (dynData.createdAt) {
    aVersion.createdAt = parseInt(dynData.createdAt.N, 10);
  }
}
