var _ = require('underscore');
var path = require('path');

var assetLists = require('./server/lib/assets').sources;

function minToSourceFilename(min) {
  return min.replace('.min', '.full');
}


module.exports = function(grunt) {
  var concatConfig = {};
  var cleanConfig = [];
  var uglifyConfig = {};
  var cssminConfig = {};

  ['js', 'css'].forEach(function(type) {
    Object.keys(assetLists[type]).forEach(function(minifiedFile) {
      var sources = _.map(assetLists[type][minifiedFile], function(filename) {
        return path.join('www', filename);
      });

      concatConfig[minifiedFile] = {
        src: sources,
        dest: path.join('www', minToSourceFilename(minifiedFile))
      };

      cleanConfig.push(path.join('www', minToSourceFilename(minifiedFile)));

      if ('js' === type) {
        uglifyConfig[path.join('www', minifiedFile)] = sources
        //[path.join('www', minToSourceFilename(minifiedFile))];
      } else if ('css' === type) {
        cssminConfig[minifiedFile] = {
          src: path.join('www', minToSourceFilename(minifiedFile)),
          dest: path.join('www', minifiedFile)
        }
      }

    });
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: concatConfig,

    uglify: {
      options: {
        banner: '/* This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at http://mozilla.org/MPL/2.0/. */\n\n',
        sourceMap: true,
        mangle: false,
        compress: false
      },
      all_assets: {
        files: uglifyConfig
      }
    },
    cssmin: cssminConfig,
    clean: cleanConfig
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');


  grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'clean']);
};
