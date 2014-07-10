/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// utilities for creating new public / private keypairs

var path = require('path');
var fs = require('fs');
var execFile = require('child_process').execFile;

var log = require('winston');

// TODO take config instead, simplies a lot
module.exports = function(config, cb) {
  cb = cb || function() {};
  var publicDir = path.join(path.dirname(config.configCertsDir), 'public');
  var derBasename = config.derFilePath.substring(0, config.derFilePath.length - ('.der'.length));

  var generatePhoneCertDB = [config.binPath + '/generate_phone_cert_db.sh', derBasename, publicDir];
  execFile(generatePhoneCertDB[0], generatePhoneCertDB.slice(1),
    function(err, stdout, stderr) {
      log.error('STDOUT', stdout);
      if (err) {
        log.error('STDERR', stderr);
        return cb(err);
      } else {
        ['cert9.db', 'key4.db', 'pkcs11.txt'].forEach(function(pubFile) {
          var symLink = path.join(path.resolve('www'), pubFile);
          try {
            fs.unlinkSync(symLink);
          } catch (e) {}
          fs.symlinkSync(path.join(publicDir, 'certdb.tmp', pubFile), symLink);
        });
        cb(null);
      }
    });
};
