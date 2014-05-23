/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');

exports.stripBOM = function(text) {
  var start = 0;
  var bomChars = ['\uFFFE', '\uFEFF'];
  if (typeof text === 'object') {
    text = new Buffer(text, 'utf8').toString('utf8');
  }
  for (var i = 0; i < text.length; i++) {
    if (text.charAt && bomChars.indexOf(text.charAt(i)) !== -1) {
      // Skip this char
      start = i + 1;
    } else {
      break;
    }
  }
  return text.substring(start);
};

exports.checkInputs = function(inputs) {
  inputs.forEach(function(input, i) {
    if (!input) {
      throw new Error('Input ' + i + ' to checkInputs was bad.' + JSON.stringify(inputs));
    }
  });
};

exports.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
};
