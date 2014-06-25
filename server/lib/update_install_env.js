/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

/**
 * Update files in the extractionDir with regards to our
 * BetaFox install environment.
 * Then re-package them to the zipFilePath
 */
module.exports = function(config, zipFilePath, extractionDir, cb) {
  var manifest;
  var manifestFile = path.join(extractionDir, 'manifest.webapp');

  fs.readFile(manifestFile, {
    encoding: 'utf8'
  }, function(err, data) {
    try {
      manifest = JSON.parse(data);
    } catch (err) {
      return cb(err.stack || err);
    }
    if ( !! manifest.installs_allowed_from &&
      1 === manifest.installs_allowed_from.length &&
      '*' === manifest.installs_allowed_from[0]) {
      // BetaFox installs will work from '*', NO-OP
    } else {
      manifest.installs_allowed_from = manifest.installs_allowed_from || [];
      manifest.installs_allowed_from.push(config.publicUrl);
    }
    fs.writeFile(manifestFile, JSON.stringify(manifest, null, 4), {
      encoding: 'utf8'
    }, function(err) {
      if (err) return cb(err.stack || err);
      fs.unlink(zipFilePath, function(err) {
        if (err) return cb(err.stack || err);
        var zip = spawn('zip', ['-r', zipFilePath, '.'], {
          cwd: extractionDir
        });

        zip.stderr.on('data', function(data) {
          console.log('zip STDERR: ' + data);
        });

        zip.on('close', function(code) {
          if (0 !== code) {
            console.log('zip finished with an error, exit code:', code);
            cb(new Error('zip finished with an error, exit code:', code));
          } else {
            cb(null, manifest);
          }
        });
      });
    });
  });
};
