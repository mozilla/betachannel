#!/usr/bin/env node

var path = require('path');

var confsys = require('../server/lib/config');
var keystore = require('../server/lib/keystore.js');

var configDir = path.join(__dirname, '..', 'server', 'config');

var configFiles = process.env.CONFIG_FILES ||
  (path.join(configDir, 'default.js') +
',' + path.join(configDir, 'developer.js'));

confsys.init({
'config-files': configFiles
});

confsys.withConfig(function(config) {
  console.log('AOK ks init');

  keystore.init(config, function(err) {
    console.log(err);
    console.log('AOK keystore delete');

    keystore.delete(function(err) {
      console.log(err);
      console.log('Deleted private key err=', err);
    });
  });
});


