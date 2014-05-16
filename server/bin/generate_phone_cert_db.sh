#!/bin/sh
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/. */

# For use by a sysadmin or a tester; configures a phone to do beta testing
# of privileged open web apps

# see https://github.com/wfwalker/marketplace-certs
# see https://github.com/digitarald/d2g
# see https://wiki.mozilla.org/Marketplace/Reviewers/Apps/InstallingReviewerCerts

if [ $# -ne 2 ]; then
	echo "usage: generate_phone_cert_db.sh <der_file> <public_directory>"
        echo "der_file should not have the .der file extension in the input"
	exit 1
else
	derFile=$1
	publicDirectory=$2
fi

echo "\n*** generate_phone_cert_db.sh $1 $2"

echo "\n*** wiping temporary cert DB"
mkdir -p ${publicDirectory}
rm -Rf ${publicDirectory}/certdb.tmp

echo "\n*** create new temporary cert DB"
pwd
./server/bin/new_certdb.sh ${publicDirectory}/certdb.tmp


if [ $wgetResponse -ne 0 ]; then
	echo "could not download DER file from $derFileURL, check your hostname and server and try again"
	exit 1
fi

echo "\n*** add d2g cert to temporary cert DB"
./server/bin/add_or_replace_root_cert.sh ${publicDirectory}/certdb.tmp $derFile
