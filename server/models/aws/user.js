/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * TODO: Currently in DynamoDB we have only one Table Version
 */

exports.User = function(email) {
  this.email = email;
};

exports.findUserByEmail = function(email, cb) {
  cb(null, new exports.User(email));
};

exports.findOrCreateUserByEmail = function(email, cb) {
  cb(null, new exports.User(email));
};
