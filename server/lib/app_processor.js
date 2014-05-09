'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');

var config = require('../config/config');
var keygen = require('../lib/keygen');
var owaReader = require('../lib/owa_reader');
var owaWriter = require('../lib/owa_writer');
var Project = require('../models/project');
var Version = require('../models/version');

module.exports = function(userId, unsignedPackagePath, cb) {
  owaReader(unsignedPackagePath, function(err, manifest, extractionDir) {
    if (err) return cb(err);
    _createProject(manifest, userId, function(err, newProject, newVersion, originalVersion) {
      if (err) return cb(err);
      if (originalVersion !== newVersion.version) {
        var updates = {
          version: newVersion.version
        };
        owaWriter(unsignedPackagePath, extractionDir, updates, function(err) {
          if (err) return cb(err);
          signPackage(unsignedPackagePath, newProject, newVersion, cb);
        });
      } else {
        signPackage(unsignedPackagePath, newProject, newVersion, cb);
      }
    });
  });
};

function _createProject(manifest, userId, cb) {
  var aProject = new Project({
    name: manifest.name,
    _user: userId
  });
  var originalVersion = manifest.version;
  var version = originalVersion;
  aProject.save(function(err) {
    if (err) {
      return cb(err);
    }
    if (!version) {
      version = aProject._id + '.' + Date.now();
    }
    var aVersion = new Version({
      version: version,
      manifest: JSON.stringify(manifest),
      _project: aProject._id
    });
    aVersion.save(function(err) {
      if (err) {
        return cb(err);
      }
      aProject._version = aVersion._id;
      aProject.save(function() {
        // version is the original version
        return cb(null, aProject, aVersion, originalVersion);
      });
    });
  });
}

function signPackage(unsignedPackagePath, newProject, newVersion, cb) {
  fs.mkdir(path.join(os.tmpdir(), 'd2g-signed-packages'), function(err) {
    // Error is fine, dir exists

    var signedPackagePath = path.join(os.tmpdir(), 'd2g-signed-packages', newProject.id + '.zip');

    keygen.signAppPackage(config.configCertsDir, unsignedPackagePath, signedPackagePath, function(exitCode) {
      if (0 !== exitCode) {
        return cb(new Error('Unable to sign app ' + exitCode));
      }

      // https://github.com/digitarald/d2g/issues/34
      //var signedPackage = new SignedPackage();
      //signedPackage.signedPackage = fs.readFileSync(signedPackage);
      //signedPackage.save(function(err, newSignedPackage) {
      //newVersion._signedPackage = newSignedPackage.id;
      newVersion.signedPackagePath = signedPackagePath;
      newVersion.save(function(err) {
        return cb(null, newProject);
      });
    });
  });
}
