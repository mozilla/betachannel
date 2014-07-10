/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var fs = require('fs');

var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');
var Package = requireDriver('../files', 'packaged');
var Version = requireDriver('../models', 'version');

var ctype = 'application/zip';

module.exports = reqContext(function(req, res, ctx) {
  var appCode = req.params.appCode;
  var version = req.params.version;

  var parts = appCode.split(',');
  var email = parts[0];

  App.loadByCode(email, appCode, function(err, anApp) {
    if (err) {
      // TODO Nicer error pages
      return res.send('Unable to locate app ' + appCode, 400);
    }
    ctx.app = anApp;
    Version.loadByVersion(anApp, version, function(err, aVersion) {
      if (err) {
        console.log(err.stack || err);

        // TODO Nicer error pages
        return res.send('Unable to load latest version', 500);
      }

      Package.load(aVersion.signed_package_location, function(err, zip) {
        if (err) {
          console.log(err);
          return res.send(404);
        }
        res.setHeader('Content-Type', ctype);
        res.send(zip);
      });
    });
  });

});
