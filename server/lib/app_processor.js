/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');

// TODO why are these ../lib?
var keygen = require('../lib/keygen');
var owaReader = require('../lib/owa_reader');
var owaWriter = require('../lib/owa_writer');
var requireDriver = require('../lib/db').requireDriver;
var updateInstallEnv = require('../lib/update_install_env');

var App = requireDriver('../models', 'app');
var Version = requireDriver('../models', 'version');

var Icon = requireDriver('../files', 'icon');
var Package = requireDriver('../files', 'packaged');

module.exports = function(config, user, unsignedPackagePath, cb) {
  owaReader(unsignedPackagePath, function(err, manifest, extractionDir) {
    if (err) return cb(err);

    updateInstallEnv(config, unsignedPackagePath, extractionDir, function(err, manifest) {
      if (err) return cb(err);
      var anApp = new App.App(user.email, manifest);
      var appCode = anApp.code;
      var signedPackagePath = path.join(os.tmpdir(), 'd2g-signed-packages', appCode + '.zip');
      var icon = bestIcon(extractionDir, manifest);
      // TODO Bug#38 - Need requirements - Should we use app.id, app.code or manifest.name
      // Should we use manifest.version, version.id, or a timestamp?
      var meta = {
        iconLocation: icon,
        signedPackagePath: signedPackagePath,
        version: manifest.version,
        manifest: manifest,
        appId: makeId(manifest.name),
        appVersionId: new Date().getTime()
      };
      // TODO: do we detect version numbers and have any biz logic around that?
      //owaWriter(unsignedPackagePath, extractionDir, updates, function(err) {
      signPackage(config, user, unsignedPackagePath, meta, cb);
    });
  });
};

function makeId(name) {
  return name.toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

function _createApp(user, versionMetadata, cb) {
  App.findOrCreateApp(user, versionMetadata.manifest, function(err, anApp) {
    if (err) {
      return cb(err);
    }
    Version.create(anApp, versionMetadata, function(err, aVersion) {
      cb(err, anApp, aVersion);
    });
  });
}

function signPackage(config, user, unsignedPackagePath, meta, cb) {
  fs.mkdir(path.join(os.tmpdir(), 'd2g-signed-packages'), function(err) {
    // Error is fine, dir exists

    keygen.signAppPackage(config.binPath, config.configCertsDir, unsignedPackagePath, meta.signedPackagePath, meta.appId, meta.appVersionId, function(exitCode) {
      if (0 !== exitCode) {
        return cb(new Error('Unable to sign app exit code:' + exitCode));
      }

      // https://github.com/digitarald/d2g/issues/34
      //var signedPackage = new SignedPackage();
      //signedPackage.signedPackage = fs.readFileSync(signedPackage);
      //signedPackage.save(function(err, newSignedPackage) {
      //newVersion._signedPackage = newSignedPackage.id;
      fs.stat(meta.signedPackagePath, function(err, stat) {
        if (err) return cb(err);
        meta.signedPackageSize = stat.size;

        Icon.save(meta.iconLocation, function(err, newIconLocation) {
          if (err) return cb(err);
          meta.iconLocation = newIconLocation;
          Package.save(meta.signedPackagePath, function(err, newPackPath) {
            if (err) return cb(err);
            meta.signedPackagePath = newPackPath;
            _createApp(user, meta, function(err, newApp, newVersion) {
              cb(err, newApp);
            });
          });
        });
      });
    });
  });
}

function bestIcon(extractionDir, manifest) {
  var large;
  Object.keys(manifest.icons).forEach(function(size) {
    var aSize = parseInt(size, 10);
    if (!large || aSize > large) {
      large = aSize;
    }
  });

  if ( !! large) {
    return path.resolve(extractionDir, path.join('.', manifest.icons[large + '']));
  } else {
    return '/i/unknown_app.png';
  }
}
