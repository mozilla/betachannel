/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var AWS = require('aws-sdk');
var uuid = require('node-uuid').v4;

var DB = require('../../lib/db_aws');
var User = require('./user').User;

var appModel = require('./app'); // Node module isn't fully loaded yet

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
    TableName: DB.VERSIONS,
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
      console.log(err.stack || err);
    }
  });
};

exports.Version.prototype.deleteVersion = function(cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.VERSIONS,
    Key: {
      versionId: {
        S: this.versionId
      },
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
    ReturnValues: 'NONE'
  };
  dynamoDB.deleteItem(params, function(err, data) {
    cb(err);
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
    TableName: DB.VERSIONS,
    Item: {
      versionId: {
        S: versionId
      },
      createdBy: {
        S: app.user.email
      },
      appId: {
        S: app.appId
      },
      appCode: {
        S: app.appCode
      },

      manifest: {
        S: JSON.stringify(versionData.manifest)
      },
      iconLocation: {
        S: versionData.iconLocation
      },
      signedPackageLocation: {
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

    aVersion.appId = app.appId;
    aVersion.appCode = app.appCode;
    aVersion.createdBy = app.user.email;

    aVersion.icon_location = versionData.iconLocation;
    aVersion.signed_package_location = versionData.signedPackagePath;
    aVersion.signed_package_size = versionData.signedPackageSize;
    aVersion.createdAt = createdAt;

    // Give out backend a chance to associate App and Version
    app.addVersion(aVersion, function(err) {
      cb(err, aVersion);
    });
  });
};

exports.loadByVersion = function(app, versionId, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.VERSIONS,
    Key: {
      versionId: {
        S: versionId
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
        var anApp = new appModel.App(aUser.email, manifest);
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
  if (app && app.latestVersion) {
    return exports.loadByVersion(app, app.latestVersion, cb);
  } else {
    cb(err, null);
  }
};

// TODO: version number - from system or from the manifest.version?
// Probably from the system
// TODO make versionId nicer than UUID?
// or
// Support short codes?
exports.versionList = function(app, cb) {
  var versionList = [];
  for (var i = 0; i < app.versionList.versions.length; i++) {
    var ver = app.versionList.versions[i];
    versionList.push([ver.id, ver.version]);
  }

  cb(null, versionList);
};

function populate(aVersion, manifest, dynData) {
  aVersion.manifest = manifest;

  aVersion.versionId = dynData.versionId.S;
  aVersion.id = dynData.versionId.S;
  aVersion.appId = dynData.appId.S;
  if (dynData.appCode) {
    aVersion.appCode = dynData.appCode.S;
  }
  if (dynData.createdBy) {
    aVersion.createdBy = dynData.createdBy.S;
  }
  if (dynData.iconLocation) {
    aVersion.icon_location = dynData.iconLocation.S;
  }
  if (dynData.signedPackageLocation) {
    aVersion.signed_package_location = dynData.signedPackageLocation.S;
  }
  if (dynData.signedPackageSize) {
    aVersion.signed_package_size = parseInt(dynData.signedPackageSize.N, 10);
  }
  if (dynData.createdAt) {
    aVersion.createdAt = parseInt(dynData.createdAt.N, 10);
  }
}
