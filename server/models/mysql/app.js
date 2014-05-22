/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var DBAccess = require('../../lib/db_mysql').DBAccess;

// TODO Maybe we don't expose this constructor?
exports.App = function(user, manifest) {
  // TODO don't keep all this data in memory, it's in the User
  this.user = user;
  // TODO don't keep all this data in memory, it's in the Version
  this.manifest = manifest;
};

exports.App.prototype = DBAccess;

// TODO not sure about this, need something
// to get the system bootstrapped
// important security decisions here
function appCode(user, manifest) {
  return user.email + ',' + manifest.name;
}

/**
 * Callback(err, app) - app is an object or null
 */
exports.findApp = function(user, manifest, cb) {
  var anApp = new exports.App(user, manifest);
  var code = appCode(user, manifest);
  // TODO abstract into findOne in DBAccess
  anApp.withConnection(function(err, conn) {
    conn.query('SELECT id, code, user_id FROM app WHERE code = ?', [code],
      function(err, rows) {
        if (err) {
          return cb(err);
        } else if (0 === rows.length) {
          return cb(null, null);
        } else {
          ['id', 'code', 'user_id'].forEach(function(key) {
            anApp[key] = rows[0][key];
          });
          console.log('This app will be available at ', encodeURIComponent(anApp.code));
          return cb(null, anApp);
        }
      });
  });
};

/**
 * Callback(err, app) - app is an object or null
 */
exports.findOrCreateApp = function(user, manifest, cb) {
  if (!user || !manifest) return cb(
    new Error('Invalid API usage'));
  var code = appCode(user, manifest);
  // TODO abstract findOneOrCreate in DBAccess
  exports.findApp(user, manifest, function(err, anApp) {
    if (err) return cb(err);

    if (null === anApp) {
      anApp = new exports.App(user, manifest);
      anApp.withConnection(function(err, conn) {
        conn.query('INSERT INTO app (code, user_id) VALUES (?, ?)', [code, user.id],
          function(err, rows) {
            if (err) return cb(err);
            return exports.findApp(user, manifest, cb);
          });
      });
    } else {
      return cb(null, anApp);
    }
  });
};

exports.loadByCode = function(email, code, cb) {

  if (!code) return cb(new Error('Must provide app code'));

  // email isn't really a user, doh!
  // we don't have a manifest yet... doh!
  var anApp = new exports.App(email, code);
  // TODO abstract into findOne in DBAccess
  anApp.withConnection(function(err, conn) {
    conn.query('SELECT id, code, user_id FROM app WHERE code = ?', [code],
      function(err, rows) {
        if (err) {
          return cb(err);
        } else if (0 === rows.length) {
          return cb(null, null);
        } else {
          ['id', 'code', 'user_id'].forEach(function(key) {
            anApp[key] = rows[0][key];
          });
          console.log('This app will be available at ', encodeURIComponent(anApp.code));
          return cb(null, anApp);
        }
      });
  });
};

exports.appList = function(email, cb) {
  // email isn't really a user, doh!
  // we don't have a manifest yet... doh!
  var anApp = new exports.App(email, 'TODO');
  // TODO abstract into findOne in DBAccess
  anApp.withConnection(function(err, conn) {
    conn.query('SELECT code FROM app JOIN user ON user.id = app.user_id WHERE user.email = ? ORDER BY app.id DESC', [email],
      function(err, rows) {
        if (err) {
          return cb(err);
        }
        var apps = [];
        for (var i = 0; i < rows.length; i++) {
          apps.push(rows[i].code);
        }
        return cb(null, apps);
      });
  });
};
