/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



var checkAuth = require('../lib/check_authentication.js');
var processor = require('../lib/app_processor');
var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var findUserByEmail = requireDriver('../models', 'user').findUserByEmail;
var findOrCreateUserByEmail = requireDriver('../models', 'user').findOrCreateUserByEmail;

module.exports = function(config) {
  return checkAuth(
    reqContext(function(req, res, ctx) {
      // Find or create the user
      findOrCreateUserByEmail(ctx.email, function(err, user) {
        if (err) {
          console.log(err.stack || err);
          return res.send('DB Error', 500);
        }
        console.log(req.files);
        if (!req.files || !req.files.app_package || !req.files.app_package.path) {
          return res.send(400, 'Bad upload');
        }
        var unsignedPackagePath = req.files.app_package.path;
        processor(config, user, unsignedPackagePath, function(err, anApp) {
          if (err) {
            console.log(err.stack || err);
            return res.send(404, 'Unable to read app zip');
          }
          res.redirect('/app/' + encodeURIComponent(anApp.code));
        });
      });
    }));
};
