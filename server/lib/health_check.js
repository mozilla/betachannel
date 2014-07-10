/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');

var log = require('winston');

var keygen = require('./keygen');
var keystore = require('./keystore');

module.exports = function(config, cb) {
  keystore.init(config, function(err) {
    keystore.exists(function(err, ks) {
      if (err) {
        log.error('ERR: Unable to access certificates. Bailing');
        process.exit(1);
      }
      if (false === ks) {
        log.warn('WARNING: No d2g certificates found, creating new ones');
        log.warn('WARNING: Generating DER file at ' + config.derFilePath);
        log.warn('WARNING: Generating Cert DB at ' + config.configCertsDir);
        if (keystore.usingS3()) {
          log.info('Cert DB will be backed up privately to S3');
        } else {
          log.warn('WARNING: If you care about app compatibility, backup and secure these!');
        }
        keygen.createKeypair(config.binPath, config.configCertsDir, config.derFilePath, function(err) {
          keystore.backupRemotely();
          cb(null);
        });
      } else {
        // We have a ks, we're good to go
        cb(err);
      }
    });
  });

};
