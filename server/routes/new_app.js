/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var checkAuth = require('../lib/check_authentication.js');
var processor = require('../lib/app_processor');
var reqContext = require('../lib/request_context');
var findUserByEmail = require('../models/user').findUserByEmail;
var findOrCreateUserByEmail = require('../models/user').findOrCreateUserByEmail;

module.exports = function(config) {
  return checkAuth(
    reqContext(function(req, res, ctx) {
      // Find or create the user
      findOrCreateUserByEmail(ctx.email, function(err, user) {
        if (err) return res.send('DB Error', 500);
        console.log('new_app.js USER!!!!', err, user);


        // Find or create app
        var appId = 'foo';
        // Create new version
        // Redirect to App's page

        console.log(req.files);

        if (!req.files || !req.files.app_package || !req.files.app_package.path) {
          return res.send(400, 'Bad upload');
        }


        var unsignedPackagePath = req.files.app_package.path;

        processor(config, user, unsignedPackagePath, function(err, anApp) {
          if (err) {
            console.log(err);
            console.log(err.stack);
            console.error(err);
            return res.send(404, 'Unable to read app zip');
          }
          res.redirect('/app/' + encodeURIComponent(anApp.code));
          //		project.populate('_version', function() {
          //			res.send(project.toCleanObject());
          //		})
        });
      });
    }));
};
