var execFile = require('child_process').execFile;
var fs = require('fs');
var path = require('path');

var _ = require('underscore');
var log = require('winston');

var stripBOM = require('./utils').stripBOM;

/**
 * Updates manifest.webapp under extractDir based on
 * props provided
 */
module.exports = function(packagedAppPath, extractDir, props, cb) {
  readMetadata(extractDir, function(err, manifest, extractDir, manifestPath) {
    if (err) return cb(err);
    _.extend(manifest, props);
    fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4), {
        encoding: 'utf8'
      },
      function(err) {
        // Package up the app
        // Package up the app
        var zipCmd = ['zip', '-r', packagedAppPath, '.'];
        exec(zipCmd[0], zipCmd.slice(1), {
          cwd: extractDir
        }, function(err, stdout, stderr) {
          if (err) {
            log.error('Unable to ' + zipCmd.join(' '));
            if (stdout) log.error(stdout);
            if (stderr) log.error(stderr);
            log.error(err);
            return cb(err);
          }
          readMetadata(extractDir, cb);
        });

        return cb(err);
      });
  });


};

// TODO Duplicate code
function readMetadata(extractDir, cb) {
  var manifestPath = path.join(extractDir, 'manifest.webapp');
  var stat = fs.statSync(manifestPath);
  fs.readFile(manifestPath, {
      encoding: 'utf8'
    },
    function(err, data) {
      if (err) {
        return cb(err);
      }
      try {
        var appManifest = JSON.parse(stripBOM(data));
        if (!appManifest.name) {
          return cb(new Error('App Manifest is missing a name'));
        }
        // No version is okay, we'll create one based on Mongo IDs
        return cb(null, appManifest, extractDir, manifestPath);
      } catch (e) {
        return cb(e);
      }

    });
}
