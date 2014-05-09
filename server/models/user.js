/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var DBAccess = require('../lib/db').DBAccess;

// TODO Maybe we don't expose this constructor?
exports.User = function(email) {
  this.email = email;
};

exports.User.prototype = DBAccess;

/**
 * Callback (err, user) - user is an object or null
 */
exports.findUserByEmail = function(email, cb) {
  var aUser = new exports.User(email);
  aUser.withConnection(function(err, conn) {
    conn.query('SELECT id FROM user WHERE email = ?', [email], function(err, rows) {
      if (err) {
        return cb(err);
      }
      if (0 === rows.length) {
        return cb(null, null);
      } else {
        aUser.id = rows[0].id;
        cb(null, aUser);
      }
    });
  });
};

/**
 * Callback (err, user) - user is an object or null
 */
exports.findOrCreateUserByEmail = function(email, cb) {
  exports.findUserByEmail(email, function(err, aUser) {
    if (err) {
      return cb(err);
    }

    if (null === aUser) {
      var aUser = new exports.User(email);
      aUser.withConnection(function(err, conn) {
        conn.query('INSERT INTO user (email) VALUES (?)', [email], function(err, rows) {
          if (err) {
            return cb(err);
          }
          return exports.findUserByEmail(email, cb);
        });
      });
    } else {
      return cb(null, aUser);
    }
  });
};
