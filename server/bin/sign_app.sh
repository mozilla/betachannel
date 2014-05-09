#!/bin/bash
# Usage:
# export NSS_PREFIX=<path to NSS tools> \
# PATH=$NSS_PREFIX/bin:$NSS_PREFIX/lib:$PATH ./generate.sh

# bwalker says:
# I got this to run to completion on my Mac using
# TMP=/tmp DYLD_LIBRARY_PATH=/usr/local/Cellar/nss/3.14.1/lib/ ./generate.sh

set -x

# sign an app for the input file and output file.
# assumes the global password file and cert database still exist

# initalize config/certs dir
configCertsDir=$1

# password file persists in the configCerts dir (must match with generate_cert.sh)
passwordfile=$configCertsDir/password.txt

# input file is second argument, output file is third argument
unsigned_zip=$2
out_signed_zip=$3

# database location must match with generate_cert.sh
db=$configCertsDir/trusted

# TODO: need full path to python script?
# TODO: need DYLIB path?
DYLD_LIBRARY_PATH=/usr/local/Cellar/nss/3.14.1/lib/ python `dirname $0`/sign_b2g_app.py -d $db -f $passwordfile -k ee1 -i $unsigned_zip -o $out_signed_zip -S test_app_identifier -V 1
