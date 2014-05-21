/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');

module.exports = function(cb) {
  return function(req, res) {
    var ctx = {};

    ctx.isAuthenticated = !! req.session.email;
    ctx.email = req.session.email;
    ctx.csrf = req.csrfToken();

    if (ctx.isAuthenticated) {
      App.appList(ctx.email, function(err, apps) {
        if (err) {
          console.error(err);
          ctx.apps = [];
        } else {
          var ourApps = [];
          apps.forEach(function(appStr) {
            var parts = appStr.split(',');
            ourApps.push({
              name: parts[1],
              code: appStr
            });
          });
          ctx.apps = ourApps;
        }
        return cb(req, res, ctx);
      });
    } else {
      return cb(req, res, ctx);
    }
  };
};
