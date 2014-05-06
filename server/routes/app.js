/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var checkAuth = require('../lib/check_authentication.js');
var reqContext = require('../lib/request_context');

module.exports = checkAuth(
  reqContext(function(req, res, ctx) {
    // Find App or 404
    var appId = req.param.appId;
    // Load versions
    // Redirect to App's page
    res.render('app.html', ctx);
  }));
