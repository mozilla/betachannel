/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');

var keygen = require('./keygen');

module.exports = function(config) {
  // Do we have certificate keypair?
  fs.exists(config.derFilePath, function(exists) {
    if (false === exists) {
      console.log('WARNING: No d2g certificates found, creating ephemeral ones');
      console.log('WARNING: Generating DER file at ' + config.derFilePath);
      console.log('WARNING: Generating Cert DB at ' + config.configCertsDir);
      console.log('WARNING: If you care about app compatibility, backup and secure these!');
      keygen.createKeypair(config.binPath, config.configCertsDir, config.derFilePath);
    }
  });
};
