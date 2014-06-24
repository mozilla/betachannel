/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var appDetails = require('./app_details');
var appIcon = require('./app_icon');
var appInstall = require('./app_install');
var confirmDeleteApp = require('./confirm_delete_app');
var dashboard = require('./dashboard');
var deleteApp = require('./delete_app');
var deleteVersion = require('./delete_version');
var manifest = require('./manifest');
var newApp = require('./new_app');
var packagedApp = require('./packaged_app');
var publicCertificate = require('./certificate');
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
    ctx.publicHostname = config.publicUrl;
    res.render('help.html', ctx);
  }));

  app.get('/dashboard', dashboard);

  app.get('/app/:appCode', appDetails);
  app.get('/confirm_delete/app/:appCode', confirmDeleteApp);
  app.delete('/app/:appCode/v/:version', deleteVersion);
  app.delete('/app/:appCode', deleteApp);
  app.get('/app/install/:appCode', appInstall(config));
  app.get('/app/v/:version/install/:appCode', appInstall(config));

  // appIcon only used in "Enterprise" deployment, not Cloud
  app.get('/app_icon/v/:version/app/:appCode', appIcon);
  app.get('/manifest/v/:version/app/:appCode/manifest.webapp', manifest(config));
  app.get('/packaged/v/:version/app/:appCode/package.zip', packagedApp);

  app.post('/apps', newApp(config));

  app.get('/cert', publicCertificate(config));
}
