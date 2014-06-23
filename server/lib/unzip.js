/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var spawn = require('child_process').spawn;

var MAX_ZIP_SIZE = 100000;

/**
 * Unzips a zip file into a destination.
 * Callback is called with err
 */
module.exports = function(zipPath, destPath, cb) {
  var unzip = spawn('unzip', ['-o', zipPath], {
    cwd: destPath
  });
  unzip.stderr.on('data', function(data) {
    console.log('unzip STDERR: ' + data);
  });
  unzip.on('close', function(code) {
    if (0 !== code) {
      console.log('unzip finished with an error, exit code:', code);
      cb(new Error('unzip finished with an error, exit code:', code));
    } else {
      cb(null);
    }
  });
};
