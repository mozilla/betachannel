/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var winston = require('winston');

module.exports = function(config) {
  winston.add(winston.transports.File, {
    timestamp: function() {
      return new Date().toISOString();
    },
    level: config.logLevel,
    filename: config.logFile
  });

  if (!process.env.LOG_TO_CONSOLE) {
    winston.remove(winston.transports.Console);
  }
};
