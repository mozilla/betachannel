/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var request = require('request');

var cache = {};
module.exports = function(url, cb) {
  if (cache[url]) {
    cb(null, cache[url]);
  } else {
    request('http://tinyurl.com/api-create.php?url=' + encodeURI(url), function(err, res, data) {
      if (err) return cb(err);
      if (200 !== res.statusCode) {
        console.log('tinyurl status=', res.statusCode, 'body=', data);
        return cb(new Error('Tiny Url Error: ' + res.statusCode));
      } else {
        cache[url] = data;
        cb(null, data);
      }
    });
  }
};
