#!/bin/sh
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/. */
#
# This program adds a new root certificate, trusted for code signing, to the
# device's user (read-write) certificate database. The device has the
# production Mozilla Marketplace root built into it, but for various testing
# purposes it is useful to add additional roots. See ./README.txt for more
# information.

set -e

certdbdir="$1"
certname="$2"

usage()
{
  echo "usage: ./add_root_cert.sh <certdb-directory> <certname>"
  echo
  echo "<certname> must be one of: marketplace-dev-public-root,"
  echo "                           marketplace-dev-reviewers-root"
  echo "                           marketplace-stage-public-root"
  exit 1
}

if [ -z "$certdbdir" ]; then
  usage
  exit 1
fi

# if [ "$certname" != "marketplace-dev-public-root" -a \
#      "$certname" != "marketplace-dev-reviewers-root" -a \
#      "$certname" != "marketplace-stage-public-root" -a \
#      "$certname" != "root-ca-reviewers-marketplace" ]; then
#   usage
#   exit 1
# fi

replace_cert()
{
  echo "Deleting the old version of the certificate (if any)."
  echo "NSS_DEFAULT_DB_TYPE=$1 certutil -d \"$certdbdir\" -D -n $certname || true"
  NSS_DEFAULT_DB_TYPE=$1 certutil -d "$certdbdir" -D -n $certname || true

  echo "Adding the new version of the cert, trusted for code signing."
  echo "NSS_DEFAULT_DB_TYPE=$1 certutil -d \"$certdbdir\" -A -n $certname -i \"$certname.der\" -t \",,C\""
  NSS_DEFAULT_DB_TYPE=$1 certutil -d "$certdbdir" -A -n $certname -i "$certname.der" -t ",,C"
}

# Desktop builds use the dbm file format; B2G and Fennec use the sql file format.
if [ ! \( -f "$certdbdir/cert8.db" \) -a \
     ! \( -f "$certdbdir/cert9.db" \) ]; then
  echo Neither cert8.db nor cert9.db were found in $certdbdir
  exit 1
fi
if [ -f "$certdbdir/cert8.db" ]; then
  replace_cert dbm
fi
if [ -f "$certdbdir/cert9.db" ]; then
  replace_cert sql
fi
