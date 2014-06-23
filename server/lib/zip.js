/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var spawn = require('child_process').spawn;

var tmp = require('tmp');

/**
 * Creates a zip formatted archive based on a list of file paths
 * Callback is called with err and a buffer containing the zip
 */
module.exports = function(certDir, cb) {
  tmp.file(function(err, zipPath, fd) {
    zipPath += '.zip';
    var zip = spawn('zip', ['-r', zipPath, '.'], {
      cwd: certDir
    });

    zip.stderr.on('data', function(data) {
      console.log('zip STDERR: ' + data);
    });

    zip.on('close', function(code) {
      if (0 !== code) {
        console.log('zip finished with an error, exit code:', code);
        cb(new Error('zip finished with an error, exit code:', code));
      } else {
        cb(null, zipPath);
      }
    });
  });
};
