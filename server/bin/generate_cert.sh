#!/bin/bash
# Usage:
# export NSS_PREFIX=<path to NSS tools> \
# PATH=$NSS_PREFIX/bin:$NSS_PREFIX/lib:$PATH ./generate.sh

# bwalker says:
# I got this to run to completion on my Mac using
# DYLD_LIBRARY_PATH=/usr/local/Cellar/nss/3.14.1/lib/ ./generate.sh

set -x

# ################ create a new certificate using NSS's certutil

# initalize config/certs dir from first argument
configCertsDir=$1
echo "configCertsDir is $configCertsDir"
mkdir -p $configCertsDir

# second argument the location of the DER file
publicKeyDER=$2

# initialize temp directory
tmpdir=/tmp/test_signed_apps
rm -Rf $tmpdir
mkdir $tmpdir

# password file persists in the configCerts dir
passwordfile=$configCertsDir/password.txt

# initialize noise file
noisefile=$tmpdir/noise
head -c 32 /dev/urandom > $noisefile

# create password file
echo password1 > $passwordfile

# XXX: certutil cannot generate basic constraints without interactive prompts,
#      so we need to build response files to answer its questions
# XXX: certutil cannot generate AKI/SKI without interactive prompts so we just
#      skip them.
ca_responses=$tmpdir/ca_responses
ee_responses=$tmpdir/ee_responses  
echo y >  $ca_responses # Is this a CA?
echo >>   $ca_responses # Accept default path length constraint (no constraint)
echo y >> $ca_responses # Is this a critical constraint?
echo n >  $ee_responses # Is this a CA?
echo >>   $ee_responses # Accept default path length constraint (no constraint)
echo y >> $ee_responses # Is this a critical constraint?

# XXX: We cannot give the trusted and untrusted versions of the certs the same
# subject names because otherwise we'll run into
# SEC_ERROR_REUSED_ISSUER_AND_SERIAL.
org="O=Examplla Corporation,L=Mountain View,ST=CA,C=US"
ca_subj="CN=Examplla Root CA,OU=Examplla CA,$org"
ee_subj="CN=Examplla Marketplace App Signing,OU=Examplla Marketplace App Signing,$org"

# create a database using the password file
db=$configCertsDir/trusted
rm -Rf $db
mkdir $db
certutil -d $db -N -f $passwordfile


make_cert="certutil -d $db -f $passwordfile -S -v 480 -g 2048 -Z SHA256 \
                    -z $noisefile -y 3 -2 --extKeyUsage critical,codeSigning"
$make_cert -n ca1        -m 1 -s "$ca_subj" \
           --keyUsage critical,certSigning      -t ",,CTu" -x < $ca_responses
$make_cert -n ee1 -c ca1 -m 2 -s "$ee_subj" \
           --keyUsage critical,digitalSignature -t ",,,"      < $ee_responses

# In case we want to inspect the generated certs
certutil -d $db -L -n ca1 -r -o $db/ca1.der
certutil -d $db -L -n ee1 -r -o $db/ee1.der

# dump the trusted cert into a DER file
certutil -d $db -f $passwordfile -L -n ca1 -r -o $publicKeyDER  

# now that we're done with it, remove tmpdir
rm -Rf $tmpdir

