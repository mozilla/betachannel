/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var async = require('async');
var AWS = require('aws-sdk');
var uuid = require('node-uuid').v4;

var appBase = require('../app_base');
var DB = require('../../lib/db_aws');
var User = require('./user').User;
var loadByVersion = require('./version').loadByVersion;
var versionList = require('./version').versionList;

exports.App = function(email, manifest) {
  if ('string' !== typeof email) throw new Error('expected string, got ' + typeof email);
  this.user = new User(email);
  this.name = manifest.name;
  this.code = this.makeAppId(this.user, manifest);
};

exports.App.prototype.makeAppId = appBase.makeAppId;

exports.App.prototype.deleteApp = function(cb) {
  var theApp = this;
  // Uses versionList instead of this.versionList to avoid
  // leaving data, even if we have bugs in synchronizing our list
  versionList(this, function(err, versions) {
    async.each(versions, function(version, eachCB) {
      loadByVersion(theApp, version[0], function(err, aVersion) {
        if (err) {
          console.log('Error while enumerating known versions');
          console.log(err.stack || err);
          return eachCB(err);
        } else {
          aVersion.deleteVersion(function(err) {
            if (err) {
              console.log('Error while deleting one of the versions');
              console.log(err.stack || err);
              return eachCB(err);
            }
            eachCB();
          });
        }
      });
    }, function(err) {
      cb(err);
    });
  });
};

exports.App.prototype.addVersion = function(aVersion, cb) {
  this.latestVersionId = aVersion.versionId;
  this.latestVersion = aVersion.manifest.version;
  var theVersionList = this.versionList;
  this.versionList.versions.push({
    id: aVersion.versionId,
    version: this.latestVersion
  });
  var versionList = JSON.stringify(theVersionList);
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.APPS,
    Key: {
      appId: {
        S: this.appId
      }
    },
    AttributeUpdates: {
      latestVersionId: {
        Action: 'PUT',
        Value: {
          S: this.latestVersionId
        }
      },
      latestVersion: {
        Action: 'PUT',
        Value: {
          S: this.latestVersion
        }
      },
      versionList: {
        Action: 'PUT',
        Value: {
          S: versionList
        }
      }
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
    ReturnValues: 'ALL_NEW'
  };
  dynamoDB.updateItem(params, function(err, data) {
    if (err) return cb(err);
    cb(err, this);
  });
};

exports.loadByAppId = function(appId, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.APPS,
    Key: {
      appId: {
        S: appId
      }
    },
    ConsistentRead: false,
    ReturnConsumedCapacity: 'NONE'
  };
  dynamoDB.getItem(params, function(err, data) {
    if (err) return cb(err.stack || err);
    if (data.Item) {
      try {
        var anApp = new exports.App(data.Item.createdBy.S, {
          name: data.Item.name.S
        });
        populate(anApp, data.Item);
        cb(err, anApp);
      } catch (e) {
        return cb(e);
      }
    } else {
      cb(err, null);
    }
  });
};

// TODO: I wish this took an appId instead of the recipie for an AppCode
exports.findApp = function(user, manifest, cb) {
  var anApp = new exports.App(user.email, manifest);

  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.APPS,
    IndexName: DB.APPS_BY_APP_CODE,
    AttributesToGet: ['appCode', 'appId', 'createdAt', 'versionList', 'latestVersion', 'latestVersionId'],
    Select: 'SPECIFIC_ATTRIBUTES',
    KeyConditions: {
      appCode: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{
          S: anApp.code
        }]
      }
    },
    ConsistentRead: false,
    ReturnConsumedCapacity: 'NONE'
  };
  dynamoDB.query(params, function(err, data) {
    if (err) return cb(err.stack || err);
    if (data.Items && data.Items.length > 0) {
      exports.loadByAppId(data.Items[0].appId.S, cb);
    } else {
      cb(err, null);
    }
  });
};

function populate(anApp, dynData) {
  anApp.appId = dynData.appId.S;
  anApp.appCode = dynData.appCode.S;
  if ( !! dynData.name) {
    anApp.name = dynData.name.S;
  }
  if (dynData.latestVersion) {
    anApp.latestVersion = dynData.latestVersion.S;
  }
  if (dynData.latestVersionId) {
    anApp.latestVersion = dynData.latestVersionId.S;
  }
  if ( !! dynData.versionList) {
    try {
      anApp.versionList = JSON.parse(dynData.versionList.S);
    } catch (e) {
      console.log('Unable to parse JSON versionList', dynData.versionList.S);
      console.log(e.stack || e);
      anApp.versionList = {
        versions: []
      };
    }
  } else {
    anApp.versionList = {
      versions: []
    };
  }
  if (dynData.createdBy) {
    anApp.createdBy = parseInt(dynData.createdBy.N, 10);
  }
  if (dynData.createdAt) {
    anApp.createdAt = parseInt(dynData.createdAt.N, 10);
  }
}

exports.findOrCreateApp = function(user, manifest, cb) {
  exports.findApp(user, manifest, function(err, anApp) {
    if (err) return cb(err);
    if (null === anApp) {
      exports.createApp(user, manifest, cb);
    } else {
      cb(null, anApp);
    }
  });
};

exports.createApp = function(user, manifest, cb) {
  var anApp = new exports.App(user.email, manifest);

  var appId = uuid();
  var createdAt = new Date().getTime();

  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.APPS,
    Item: {
      appId: {
        S: appId
      },
      appCode: {
        S: anApp.code
      },
      createdBy: {
        S: user.email
      },
      name: {
        S: manifest.name
      },
      // latestVersionId, latestVersion isn't known yet
      versionList: {
        S: JSON.stringify({
          versions: []
        })
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
    anApp.id = appId; // TODO unify mysql and DynamoDB here
    anApp.appId = appId;
    anApp.appCode = anApp.code;
    anApp.createdBy = user.email;
    anApp.latestVersionId = null;
    anApp.latestVersion = null;
    anApp.versionList = {
      versions: []
    };
    anApp.createdAt = createdAt;
    cb(err, anApp);
  });
};

// Assumes at least one version exists
// Same as findApp?
exports.loadByCode = function(email, code, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.APPS,
    IndexName: DB.APPS_BY_APP_CODE,
    AttributesToGet: ['appId', 'appCode', 'createdAt'],
    Select: 'SPECIFIC_ATTRIBUTES',
    KeyConditions: {
      appCode: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{
          S: code
        }]
      }
    }
  };
  dynamoDB.query(params, function(err, data) {
    if (err) return cb(err);
    if (data.Count > 0) {
      exports.loadByAppId(data.Items[0].appId.S, cb);
    } else {
      cb(err, null);
    }
  });
};

exports.appList = function(email, cb) {
  var dynamoDB = new AWS.DynamoDB();
  var params = {
    TableName: DB.APPS,
    IndexName: DB.APPS_BY_CREATED_BY,
    AttributesToGet: ['appId', 'appCode', 'createdBy'],
    Select: 'SPECIFIC_ATTRIBUTES',
    KeyConditions: {
      createdBy: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{
          S: email
        }]
      }
    }
  };
  dynamoDB.query(params, function(err, data) {
    if (err) return cb(err);
    if (data.Count > 0) {
      var appList = [];
      for (var i = 0; i < data.Count; i++) {
        var appCode = data.Items[i].appCode.S;
        if (appList.indexOf(appCode) === -1) {
          appList.push(appCode);
        }
      }
      return cb(err, appList);
    } else {
      cb(err, []);
    }
  });
};
