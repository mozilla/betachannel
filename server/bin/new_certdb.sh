#!/bin/sh
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/. */
#
# This program creates a new, empty, certificate database. Usually it
# is used in conjunction with the other scripts in this directory a
# described in ./README.txt.

set -e

certdbdir="$1"

if [ -z "$certdbdir" ]; then
  echo "usage: ./new_certdb.sh <output-directory>"
  exit 1
fi

if [ -e "$certdbdir" ]; then
  echo output directory "$certdbdir" exists
  exit 1
fi

mkdir -p "$certdbdir"

NSS_DEFAULT_DB_TYPE=sql certutil -d "$certdbdir" -N -f twoblanklines

