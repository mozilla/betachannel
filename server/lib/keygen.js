"use strict";

// utilities for creating new public / private keypairs

var crypto = require('crypto');
var sys = require('sys');
var _ = require('underscore');
var os = require('os');
var path = require('path');
var fs = require('fs');
var execFile = require('child_process').execFile;

// see http://stackoverflow.com/questions/8520973/how-to-create-a-pair-private-public-keys-using-node-js-crypto
// see https://github.com/digitarald/d2g/issues/2

/**
 * Places generated keys onto local disk
 */
exports.createKeypair = function(binPath, configCertsDir, derFilePath, cb) {

  console.log('Creating Keypair ', binPath, configCertsDir, derFilePath);

  // TODO: do this ./generate_cert.sh $PWD $PWD/phone-cert.der
  // this will have the side effect of generatign the DER
  var generateCertCommand = [binPath + '/generate_cert.sh', configCertsDir, derFilePath];

  var derBasename = derFilePath.substring(0, derFilePath.length - ('.der'.length));
  var publicDir = path.join(configCertsDir, 'public');

  var generatePhoneCertDB = [binPath + '/generate_phone_cert_db.sh', derBasename, publicDir];

  console.log(generateCertCommand.join(' '));

  execFile(generateCertCommand[0], generateCertCommand.slice(1), function(err, stdout, stderr) {
    if (stdout) console.log('STDOUT', stdout);
    if (err) {
      console.log('ERROR', err);
      console.log('STDERR', stderr);
      return cb(err);
    }

    execFile(generatePhoneCertDB[0], generatePhoneCertDB.slice(1),
      function(err, stdout, stderr) {
        console.log('STDOUT', stdout);
        if (err) {
          console.log('STDERR', stderr);
        } else {
          ['cert9.db', 'key4.db', 'pkcs11.txt'].forEach(function(pubFile) {
            var symLink = path.join(path.resolve('www'), pubFile);
            try {
              fs.unlinkSync(symLink);
            } catch (e) {}
            fs.symlinkSync(path.join(publicDir, 'certdb.tmp', pubFile), symLink);
          });
        }
        cb(err);
      });
  });
};

exports.signAppPackage = function(binPath, configCertsDir, inputFile, outputFile, appId, appVersionId, cb) {
  // TODO: do this ./sign_app.sh configCertsDir $PWD/unsigned.zip $PWD/valid.zip

  var signAppCommand = [binPath + '/sign_app.sh', configCertsDir, inputFile, outputFile, appId, appVersionId];

  console.log(signAppCommand.join(' '));

  execFile(signAppCommand[0], signAppCommand.slice(1), function(error, stdout, stderr) {
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
