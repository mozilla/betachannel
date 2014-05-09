'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');

var keygen = require('../lib/keygen');
var owaReader = require('../lib/owa_reader');
var owaWriter = require('../lib/owa_writer');
var App = require('../models/app');
var Version = require('../models/version');

module.exports = function(config, user, unsignedPackagePath, cb) {
  console.log('app_processor got this far', user, unsignedPackagePath);
  owaReader(unsignedPackagePath, function(err, manifest, extractionDir) {
    if (err) return cb(err);
    console.log('read ', err, manifest, extractionDir);
    _createApp(manifest, user, function(err, newApp, newVersion, originalVersion, signedPackagePath) {
      console.log('create app callback', err, newApp, newVersion, originalVersion);
      if (err) return cb(err);
      if (originalVersion !== newVersion.version) {
        var updates = {
          version: newVersion.version
        };
        owaWriter(unsignedPackagePath, extractionDir, updates, function(err) {
          if (err) return cb(err);
          signPackage(config, unsignedPackagePath, newApp, newVersion, signedPackagePath, cb);
        });
      } else {
        signPackage(config, unsignedPackagePath, newApp, newVersion, signedPackagePath, cb);
      }
    });
  });
};

function _createApp(manifest, user, cb) {
  console.log('Creating or finding', manifest, user);
  App.findOrCreateApp(user, manifest, function(err, anApp) {
    console.log('Finding App got', err, anApp);
    if (err) {
      return cb(err);
    }

    // WUT?
    var originalVersion = manifest.version;
    var version = originalVersion;

    var signedPackagePath = path.join(os.tmpdir(), 'd2g-signed-packages', anApp.id + '.zip');

    var versionData = {
      version: version,
      signedPackagePath: signedPackagePath,
      manifest: manifest
    };


    Version.create(anApp, versionData, function(err, aVersion) {
      if (err) {
        return cb(err);
      }
      return cb(null, anApp, aVersion, originalVersion, signedPackagePath);
    });
  });
}

function signPackage(config, unsignedPackagePath, newApp, newVersion, signedPackagePath, cb) {
  fs.mkdir(path.join(os.tmpdir(), 'd2g-signed-packages'), function(err) {
    // Error is fine, dir exists

    keygen.signAppPackage(config.binPath, config.configCertsDir, unsignedPackagePath, signedPackagePath, function(exitCode) {
      if (0 !== exitCode) {
        return cb(new Error('Unable to sign app ' + exitCode));
      }

      // https://github.com/digitarald/d2g/issues/34
      //var signedPackage = new SignedPackage();
      //signedPackage.signedPackage = fs.readFileSync(signedPackage);
      //signedPackage.save(function(err, newSignedPackage) {
      //newVersion._signedPackage = newSignedPackage.id;
      cb(null, newApp);
    });
  });
}
