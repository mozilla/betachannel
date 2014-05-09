"use strict";

// utilities for creating new public / private keypairs

var crypto = require('crypto');
var sys = require('sys');
var _ = require('lodash');
var os = require('os');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var config = require('../config/config');

// see http://stackoverflow.com/questions/8520973/how-to-create-a-pair-private-public-keys-using-node-js-crypto
// see https://github.com/digitarald/d2g/issues/2

exports.createKeypair = function(configCertsDir, derFilePath, cb) {

  // TODO: do this ./generate_cert.sh $PWD $PWD/phone-cert.der
  // this will have the side effect of generatign the DER

  var generateCertCommand = [config.binPath + '/generate_cert.sh', configCertsDir, derFilePath].join(' ');

  console.log(generateCertCommand);

  exec(generateCertCommand, function(error, stdout, stderr) {
    if (stdout) console.log('STDOUT', stdout);
    if (error) {
      console.log('ERROR', error);
      console.log('STDERR', stderr);
    }
    if (typeof cb === 'function') {
      cb(error);
    }
  });
};

exports.signAppPackage = function(configCertsDir, inputFile, outputFile, cb) {
  // TODO: do this ./sign_app.sh configCertsDir $PWD/unsigned.zip $PWD/valid.zip

  var signAppCommand = [config.binPath + '/sign_app.sh', configCertsDir, inputFile, outputFile].join(' ');

  console.log(signAppCommand);

  exec(signAppCommand, function(error, stdout, stderr) {
    if (stdout) console.log('STDOUT', stdout);
    if (error) {
      console.log('ERROR', error);
      console.log('STDERR', stderr);
      if (typeof cb === 'function') {
        return cb(1);
      }
    }
    if (typeof cb === 'function') {
      cb(0);
    }
  });

};
