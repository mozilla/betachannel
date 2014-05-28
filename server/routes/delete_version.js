/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var checkAuth = require('../lib/check_authentication.js');
var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');
var Version = requireDriver('../models', 'version');

module.exports = checkAuth(
  reqContext(function(req, res, ctx) {
    var appCode = req.params.appCode;
    var versionId = req.params.version;
    App.loadByCode(ctx.email, appCode, function(err, anApp) {
      if (err) {
        console.log(err.stack || err);
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
          console.log(err.stack || err);
          // TODO Nicer error pages
          return res.send('Unable to load version', 500);
        }
        aVersion.deleteVersion(function(err) {
          if (err) {
            console.log(err.stack || err);
            res.send({
              error: 'Unable to delete this version'
            }, 400);
          } else {
            console.log('VERSION [' + versionId + '] DELETED BY [' + ctx.email + ']');
            res.send({
              status: 'okay'
            });
          }
        });
      });
    });
  }));
