/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var App = require('../models/app');
var checkAuth = require('../lib/check_authentication.js');
var reqContext = require('../lib/request_context');
var Version = require('../models/version');

module.exports = checkAuth(
  reqContext(function(req, res, ctx) {
    // TODO: Refactor into findOr404
    var appCode = req.params.appCode;
    // TODO use Async to remove pyramid of doom
    App.loadByCode(ctx.email, appCode, function(err, anApp) {
      if (err) {
        // TODO Nicer error pages
        return res.send('Unable to locate ' + ctx.email, 400);
      }
      ctx.app = anApp;
      Version.latestVersionForApp(anApp, function(err, aVersion) {
        if (err) {
          // TODO Nicer error pages
          return res.send('Unable to load latest version', 500);
        }
        aVersion.installUrl = '/app/v/' + aVersion.version + '/install/' +
          encodeURIComponent(anApp.code);
        ctx.version = aVersion;
        Version.versionList(anApp, function(err, versions) {
          if (err) {
            console.error(err);
            ctx.versions = [];
          } else {
            ctx.versions = versions;
          }

          res.render('app_details.html', ctx);

        });
      });
    });
  }));
