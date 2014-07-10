/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var async = require('async');
var log = require('winston');

var checkAuth = require('../lib/check_authentication.js');
var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');
var Version = requireDriver('../models', 'version');

var Icon = requireDriver('../files', 'icon');
var Package = requireDriver('../files', 'packaged');

module.exports = checkAuth(
  reqContext(function(req, res, ctx) {
    var appCode = req.params.appCode;
    var versionId = req.params.version;
    var goToDashboard = false;
    App.loadByCode(ctx.email, appCode, function(err, anApp) {
      if (err) {
        log.error(err.stack || err);
        // TODO Nicer error pages
        return res.send('Unable to locate ' + ctx.email, 400);
      }
      if (null === anApp) {
        return res.send('Unable to locate apps for ' + ctx.email, 404);
      }

      if (ctx.email !== anApp.user.email) {
        return res.send(ctx.email + ' does not own this app', 403);
      }
      Version.loadByVersion(anApp, versionId, function(err, aVersion) {
        if (err) {
          log.error(err.stack || err);
          // TODO Nicer error pages
          return res.send('Unable to load version', 500);
        }

        async.parallel([

            function(cb2) {
              Icon.delete(aVersion, cb2);
            },
            function(cb2) {
              Package.delete(aVersion, cb2);
            },
            function(cb2) {
              aVersion.deleteVersion(cb2);
            },
            function(cb2) {
              Version.versionList(anApp, function(err, vers) {
                // If we've removed the last version... remove the App too
                if (0 === vers.length) {
                  anApp.deleteApp(cb2);
                  goToDashboard = true;
                } else {
                  cb2(null);
                }
              });
            }
          ],
          function(err, results) {
            if (err) {
              log.error(err.stack || err);
              res.send({
                error: 'Unable to delete this version'
              }, 400);
            } else {
              log.error('VERSION [' + versionId + '] DELETED BY [' + ctx.email + ']');
              res.send({
                status: 'okay',
                goToDashboard: goToDashboard
              });
            }
          });

      });
    });
  }));
