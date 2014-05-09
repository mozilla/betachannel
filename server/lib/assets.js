/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Captures metadata about client side assets for use with compress
 * and cachify */

const
_ = require('underscore');

exports.sources = {
  js: {
    '/js/betafox.min.js': [
      '/js/lib/jquery-2.1.1.js',
      '/js/main.js',
      '/js/persona.js'
    ]
  },
  css: {
    '/css/style.min.css': [
      '/css/main.css'
    ]
  }
};

exports.cachifyList = _.extend({}, exports.sources['js'], exports.sources['css']);
