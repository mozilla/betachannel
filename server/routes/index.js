/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var appDetails = require('./app_details');
var appIcon = require('./app_icon');
var appInstall = require('./app_install');
var dashboard = require('./dashboard');
var manifest = require('./manifest');
var newApp = require('./new_app');
var packagedApp = require('./packaged_app');
var reqContext = require('../lib/request_context');

exports.init = function(config, app) {
  app.get('/', reqContext(function(req, res, ctx) {
    console.log('Doing homepage', ctx);
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

  app.get('/app/:appCode', appDetails);
  app.get('/app/install/:appCode', appInstall);
  app.get('/app/v/:version/install/:appCode', appInstall);

  // TODO would be replaced with S3
  app.get('/app_icon/v/:version/app/:appCode', appIcon);
  app.get('/manifest/v/:version/app/:appCode/manifest.webapp', manifest);
  app.get('/packaged/v/:version/app/:appCode/package.zip', packagedApp);

  app.post('/apps', newApp(config));
}
