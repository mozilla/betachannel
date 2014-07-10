/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var log = require('winston');

var DBAccess = require('../../lib/db_mysql').DBAccess;

// TODO Maybe we don't expose this constructor?
exports.Version = function(app, version) {
  this.app = app;
  this.version = version;
};

exports.Version.prototype = DBAccess;

exports.Version.prototype.updateSize = function(id, aSize) {
  this.withConnection(function(err, conn) {
    conn.query('UPDATE version SET signed_package_size = ? WHERE id = ?', [aSize, id],
      function(err, rows) {
        if (err) {
          log.error(err);
        }
      });
  });
};

exports.Version.prototype.deleteVersion = function(cb) {
  var versionId = this.versionId;
  this.withConnection(function(err, conn) {
    conn.query('DELETE FROM version WHERE id = ?', [versionId],
      function(err, rows) {
        if (err) {
          log.error("Unable to delete version");
          log.error(err);
        }
        cb(err);
      });
  });
};

/**
 * Callback (err, version) - version is an object or null
 */
exports.findOne = function(app, version, cb) {
  var aVersion = new exports.Version(app, version);
  aVersion.withConnection(function(err, conn) {
    conn.query('SELECT id, version, icon_location, signed_package_location, signed_package_size, manifest, app_id FROM version WHERE app_id = ? AND version = ?', [app.id, version],
      function(err, rows) {
        if (err) {
          return cb(err);
        }
        if (0 === rows.length) {
          return cb(null, null);
        } else {
          var err;
          [
            'id', 'version', 'icon_location', 'signed_package_location', 'signed_package_size', 'manifest', 'app_id'
          ].forEach(function(key) {
            if ('manifest' === key) {
              try {
                aVersion[key] = JSON.parse(rows[0][key]);
              } catch (e) {
                err = new Error(e);
              }
            } else if ('id' === key) {
              aVersion[key] = rows[0][key];
              aVersion.versionId = rows[0][key];
            } else {
              aVersion[key] = rows[0][key];
            }
          });
          if (err) {
            return cb(err);
          } else {
            aVersion.versionId = aVersion.id;
            log.error('This app and version will be available at ', app.code + ',' + version);
            return cb(null, aVersion);
          }
        }
      });
  });
};

/**
 * Callback (err, version) - version is an object or null
 */
exports.create = function(app, versionData, cb) {
  if (!app.id) return cb(new Error('app has no id' + app.toString()));
  if ('string' !== typeof versionData.manifest) {
    manifest = JSON.stringify(versionData.manifest);
  }
  var aVersion = new exports.Version(app, versionData.version);
  aVersion.withConnection(function(err, conn) {
    conn.query('INSERT INTO version (version, icon_location, signed_package_location, signed_package_size, manifest, app_id) VALUES (?, ?, ?, ?, ?, ?)', [versionData.version,
      versionData.iconLocation,
      versionData.signedPackagePath,
      versionData.signedPackageSize,
      manifest, app.id
    ], function(err, rows) {
      if (err) {
        return cb(err);
      }
      return exports.findOne(app, versionData.version, cb);
    });
  });
};

/**
 * @versionID - The system id for a version record,
 *     not the user visible Version number
 */
exports.loadByVersion = function(app, versionId, cb) {

  var aVersion = new exports.Version(app, versionId);
  aVersion.withConnection(function(err, conn) {
    var appId = app.id;
    conn.query('SELECT id, version, icon_location, signed_package_location, signed_package_size, manifest, app_id FROM version WHERE app_id = ? AND id = ?', [appId, versionId],
      function(err, rows) {
        if (err) {
          return cb(err);
        }
        if (0 === rows.length) {
          return cb(null, null);
        } else {
          var err;
          [
            'id', 'version', 'icon_location', 'signed_package_location', 'signed_package_size', 'manifest', 'app_id'
          ].forEach(function(key) {
            if ('manifest' === key) {
              try {
                aVersion[key] = JSON.parse(rows[0][key]);
              } catch (e) {
                err = new Error(e);
              }
            } else if ('id' === key) {
              aVersion[key] = rows[0][key];
              aVersion.versionId = rows[0][key];
            } else {
              aVersion[key] = rows[0][key];
            }
          });
          if (err) {
            return cb(err);
          } else {
            aVersion.appId = aVersion.app_id;
            aVersion.versionId = aVersion.id;
            log.error('This app and version will be available at ', app.code + ',' + aVersion.version);
            return cb(null, aVersion);
          }
        }
      });
  });
};

exports.latestVersionForApp = function(app, cb) {

  if (!app.id) return cb(new Error('App has no id ' + app.toString()));

  // TODO: We don't have a version yet...
  var aVersion = new exports.Version(app, 'TODO');
  aVersion.withConnection(function(err, conn) {
    conn.query('SELECT id, version, icon_location, signed_package_location, signed_package_size, manifest, app_id FROM version WHERE app_id = ? ORDER BY id DESC LIMIT 1', [app.id],
      function(err, rows) {
        if (err) {
          return cb(err);
        }
        if (0 === rows.length) {
          return cb(null, null);
        } else {
          var err;
          [
            'id', 'version', 'icon_location', 'signed_package_location', 'signed_package_size', 'manifest', 'app_id'
          ].forEach(function(key) {
            if ('manifest' === key) {
              try {
                aVersion[key] = JSON.parse(rows[0][key]);
              } catch (e) {
                err = new Error(e);
              }
            } else if ('id' === key) {
              aVersion[key] = rows[0][key];
              aVersion.versionId = rows[0][key];
            } else {
              aVersion[key] = rows[0][key];
            }
          });
          if (err) {
            return cb(err);
          } else {
            log.error('This app and version will be available at ', app.code + ',' + aVersion.version);
            return cb(null, aVersion);
          }
        }
      });
  });
};

exports.versionList = function(app, cb) {
  // TODO: We don't have a version yet...
  var aVersion = new exports.Version(app, 'TODO');
  aVersion.withConnection(function(err, conn) {
    conn.query('SELECT id, version FROM version WHERE app_id = ? ORDER BY id', [app.id],
      function(err, rows) {
        if (err) {
          return cb(err);
        }
        var vers = [];
        for (var i = 0; i < rows.length; i++) {
          vers.push([rows[i].id, rows[i].version]);
        }
        return cb(null, vers);
      });
  });
};
