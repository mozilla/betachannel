/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var fs = require('fs');

var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');
var Version = requireDriver('../models', 'version');

var ctype = 'application/x-web-app-manifest+json';

module.exports = function(config) {
  return reqContext(function(req, res, ctx) {
    var appCode = req.params.appCode;
    var version = req.params.version;

    // TODO: get email address out of app public identifier
    // this is weak sauce
    var parts = appCode.split(',');
    var email = parts[0];

    App.loadByCode(email, appCode, function(err, anApp) {
      if (err) {
        console.log('loadByCode failed');
        // TODO Nicer error pages
        console.log(err);
        return res.send('Unable to locate app ' + appCode, 400);
      }
      ctx.app = anApp;
      Version.loadByVersion(anApp, version, function(err, aVersion) {
        if (err) {
          console.log('loadByVersion failed');
          console.log(err);
          // TODO Nicer error pages
          return res.send('Unable to load latest version', 500);
        }

        //delete aVersion.manifest.launch_path;
        aVersion.manifest.package_path = [
          config.publicUrl, 'packaged/v', aVersion.id, 'app',
          encodeURIComponent(appCode), 'package.zip'
        ].join('/');
        aVersion.manifest.size = aVersion.signed_package_size;

        if ( !! aVersion.manifest.installs_allowed_from &&
          1 === aVersion.manifest.installs_allowed_from.length &&
          '*' === aVersion.manifest.installs_allowed_from[0]) {
          // BetaFox installs will work from '*', NO-OP
        } else {
          aVersion.manifest.installs_allowed_from = aVersion.manifest.installs_allowed_from || [];
          aVersion.manifest.installs_allowed_from.push(config.publicUrl);
        }
        res.setHeader('Content-Type', ctype);
        res.send(aVersion.manifest);
      });
    });
  });
};
