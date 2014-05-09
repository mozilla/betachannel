/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var fs = require('fs');

var App = require('../models/app');
var reqContext = require('../lib/request_context');
var Version = require('../models/version');

module.exports = reqContext(function(req, res, ctx) {
  var appCode = req.params.appCode;
  var version = req.params.version;

  App.loadByCode(ctx.email, appCode, function(err, anApp) {
    if (err) {
      // TODO Nicer error pages
      return res.send('Unable to locate app ' + appCode, 400);
    }
    ctx.app = anApp;
    Version.loadByVersion(anApp, version, function(err, aVersion) {
      if (err) {
        // TODO Nicer error pages
        return res.send('Unable to load latest version', 500);
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

      fs.readFile(aVersion.icon_location, {
        encoding: null
      }, function(err, img) {
        res.setHeader('Content-Type', ctype);
        res.send(img);
      });
    });
  });

});
