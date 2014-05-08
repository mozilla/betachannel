var assetLists = require('./server/lib/assets').sources;

function prefixAssets(prefix, assets) {
  if ('string' === typeof assets) {
    assets = ('www' + assets).replace('.min', '');
  } else {
    assets.forEach(function(asset, i) {
      assets[i] = ('www' + asset).replace('.min', '');
    });
  }
  return assets;
}

module.exports = function(grunt) {
  // TODO: Supports only one JS Build destination,
  // Should do any/all .js mappings. Same for CSS
  var jsAssetKey = Object.keys(assetLists.js)[0];
  var jsDest = prefixAssets('www', jsAssetKey);
  var jsDestMin = jsDest.replace('.js', '.min.js');
  var jsSources = prefixAssets('www', assetLists.js[jsAssetKey]);

  uglifyAssets = {};
  uglifyAssets[jsDestMin] = [jsDest];

  var cssAssetKey = Object.keys(assetLists.css)[0];
  var cssDest = prefixAssets('www', cssAssetKey);
  var cssSources = prefixAssets('www', assetLists.css[cssAssetKey]);

  allAssets = {};
  allAssets[jsDest] = jsSources;
  allAssets[cssDest] = cssSources;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      all_assets: {
        files: allAssets
      },
    },
    uglify: {
      options: {
        banner: '/* This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at http://mozilla.org/MPL/2.0/. */\n\n',
      },
      all_assets: {
        files: uglifyAssets
      }
    },
    cssmin: {
      css: {
        src: 'www/css/style.css',
        dest: 'www/css/style.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
};
