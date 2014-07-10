/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var fs = require('fs');

var log = require('winston');

var reqContext = require('../lib/request_context');
var requireDriver = require('../lib/db').requireDriver;

var App = requireDriver('../models', 'app');
var Icon = requireDriver('../files', 'icon');
var Version = requireDriver('../models', 'version');

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
    if (null === anApp) return res.send(404);
    ctx.app = anApp;
    Version.loadByVersion(anApp, version, function(err, aVersion) {
      if (err) {
        // TODO Nicer error pages
        return res.send('Unable to load latest version', 500);
      } else if (null === aVersion) {
        return res.send('Unable to load this version', 404);
      }

      var ext = path.extname(aVersion.icon_location);

      var ctypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
      }

      if (!ctypeMap[ext]) {
        return res.send('Cannot determine image type ', 500);
      }

      var ctype = ctypeMap[ext];

      Icon.load(aVersion.icon_location, function(err, img) {
        if (err) {
          log.error(err);
          return res.send(404);
        }
        res.setHeader('Content-Type', ctype);
        res.send(img);
      });
    });
  });
});
