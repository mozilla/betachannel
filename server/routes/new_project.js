/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var checkAuth = require('../lib/check_authentication.js');
var reqContext = require('../lib/request_context');

module.exports = checkAuth(
  reqContext(function(req, res, ctx) {
    // Find or create project
    var appId = 'foo';
    // Create new version
    // Redirect to project page
    res.redirect('/app/' + appId);
  }));
