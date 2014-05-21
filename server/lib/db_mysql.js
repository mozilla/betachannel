/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var mysql = require('mysql');

var pool;
exports.init = function(config, cb) {
  pool = mysql.createPool(config.mysql);
  cb();
};

function DB() {};

DB.prototype.withConnection = function(cb) {
  if (!pool) return cb(
    new Error('You must initialize db.js before using models!'));
  cb(null, pool);
};

exports.DBAccess = new DB();
