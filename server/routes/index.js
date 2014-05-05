/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var reqContext = require('../lib/request_context');

exports.init = function(app) {
  app.get('/', reqContext(function(req, res, ctx) {
    res.render('home.html', ctx);
  }));
}
