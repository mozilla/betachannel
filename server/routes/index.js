/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var appDetails = require('./app_details.js');
var appInstall = require('./app_install.js');
var dashboard = require('./dashboard.js');
var newApp = require('./new_app.js');
var reqContext = require('../lib/request_context');

exports.init = function(config, app) {
  app.get('/', reqContext(function(req, res, ctx) {
    if (ctx.isAuthenticated) {
      res.redirect('/dashboard');
    } else {
      res.render('home.html', ctx);
    }
  }));

  app.get('/help', reqContext(function(req, res, ctx) {
    ctx.publicHostname = config.publicUrl.split('://')[1];
    res.render('help.html', ctx);
  }));

  app.get('/dashboard', dashboard);

  app.get('/app/install/:appId', appInstall);
  app.get('/app/v/:version/install/:appId', appInstall);
  app.get('/app/:appId', appDetails);

  app.post('/apps', newApp);
}
