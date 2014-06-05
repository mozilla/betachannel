/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');
var Version = requireDriver('../models', 'version');

var Icon = requireDriver('../files', 'icon');

module.exports = function(config) {

  return reqContext(function(req, res, ctx) {
    var appCode = req.params.appCode;
    var version = req.params.version || 'latest';

    var parts = appCode.split(',');
    var email = parts[0];

    App.loadByCode(email, appCode, function(err, anApp) {
      if (err) {
        console.log(err.stack || err);
        // TODO Nicer error pages
        return res.send('Unable to locate app ' + appCode, 400);
      }
      ctx.app = anApp;
      if ('latest' === version) {
        Version.latestVersionForApp(anApp, useVersion);

      } else {
        Version.loadByVersion(anApp, version, useVersion);
      }

      function useVersion(err, aVersion) {
        if (err) {
          console.log(err.stack || err);
          // TODO Nicer error pages
          return res.send('Unable to load latest version', 500);
        } else if (null === aVersion) {
          return res.send('Unable to find version', 404);
        }
        aVersion.icon_url = Icon.url(aVersion);
        aVersion.manifest_url = '/manifest/v/' + aVersion.id + '/app/' + encodeURIComponent(appCode) + '/manifest.webapp';
        ctx.signedPackage = '/packaged/v/' + aVersion.id + '/app/' + encodeURIComponent(appCode) + '/package.zip';
        ctx.signedPackageSize = aVersion.signed_package_size + 'kb';
        ctx.version = aVersion;
        Version.versionList(anApp, function(err, versions) {
          if (err) {
            console.error(err.stack || err);
            ctx.versions = [];
          } else {
            ctx.versions = versions;
          }
          ctx.publicUrl = config.publicUrl;
          res.render('app_install.html', ctx);
        });
      }
    });


  });
};
