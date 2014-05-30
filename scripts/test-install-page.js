#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var url = require('url');

var request = require('request');

if (3 !== process.argv.length) {
   process.stdout.write('Usage: test-install-page.js http://10.0.1.13:8000/app/v/1/install/someApp\n');
   process.exit(1);
}
var installUrl = process.argv[2];
console.log('Checking assets for installing', installUrl);

request(installUrl, function(err, res, body) {
   if (200 !== res.statusCode) {
      exit('Unable to load install page');
   }
   testIcon(body);
   testManifest(body);
   testDirectPackageLink(body);
});

var ICON_TAG = '<img src="';

function testIcon(body) {
   var iconPath = attrValue(body, 'icon image tag', ICON_TAG);

   var iconUrl = url.resolve(installUrl, iconPath);
   console.log('Checking Icon Url:', iconUrl);
   request(iconUrl, function(err, res, body) {
      if (200 !== res.statusCode) {
         exit('Unable to download Icon url for the page');
      }
      if (0 >= parseInt(res.headers['content-length'], 10)) {
         exit('Expected an image for the install page icon');
      }
   });
}

MANIFEST_TAG = 'data-package-manifest-url="';

function testManifest(body) {
   var manifestPath = attrValue(body, 'icon image tag', MANIFEST_TAG);
   var manifestUrl = url.resolve(installUrl, manifestPath);
   console.log('Checking Manifest Url:', manifestUrl);
   request(manifestUrl, function(err, res, body) {
      if (200 !== res.statusCode) {
         exit('Unable to download manifest url for the page');
      }
      var manifest = JSON.parse(body);
      if (!manifest.name) {
         exit('Malformed manifest' + body);
      }
      if ( !! manifest.package_path) {
         testManifestPackageLink(manifest.package_path);
      }
   });
}

function testManifestPackageLink(packageUrl) {
   testPackageLink('manifest', url.resolve(installUrl, packageUrl));
}

var PACKAGE_TAG = '<a class="package-link" href="';

function testDirectPackageLink(body) {
   var packagePath = attrValue(body, 'signed package tag', PACKAGE_TAG);
   var packageUrl = url.resolve(installUrl, packagePath);
   testPackageLink('installPage', packageUrl);
}

function testPackageLink(referType, packageUrl) {
   console.log('Checking Package Url from ' + referType + ':', packageUrl);
   request(packageUrl, function(err, res, body) {
      if (err) {
         exit(err.stack || err);
      }
      if (200 !== res.statusCode) {
         exit('Unable to download package url for ' + referType);
      }
      if (0 >= parseInt(res.headers['content-length'], 10)) {
         exit('Expected an zip for the packaged app');
      }
   });
}

function attrValue(body, desc, startAttr) {
   var imgIndex = body.indexOf(startAttr);
   if (-1 === imgIndex) {
      exit('Did template change? Unable to find ' + desc + ' with ' + startAttr);
   }
   var iconUrlEnd = body.indexOf('"', imgIndex + startAttr.length);
   if (-1 === iconUrlEnd) {
      exit('Unable to find ' + desc + ' ' + imgIndex + '-' + iconUrlEnd);
   }
   return body.substring(imgIndex + startAttr.length, iconUrlEnd)
}


function exit(msg) {
   console.log('ERROR: ', msg);
   process.exit(1);
}
