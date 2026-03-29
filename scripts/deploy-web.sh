#!/bin/bash

set -e

#REMOTE_USER=ff@ff.moonspider.com
REMOTE_USER=ff@65.52.124.96

export NODE_ENV=production
export FF_BACKEND_URL=https://ff.moonspider.com

# delete dev environment
unset AMPLITUDE_API_KEY
unset FB_APP_ID

# keep API keys, et. al., out of version control
. ./prod-secrets.sh

if [ -z "$AMPLITUDE_API_KEY" ] ; then
    echo error: AMPLITUDE_API_KEY not defined - is it in "$PWD/prod-secrets.sh?"
    exit 1
fi    

if [ -z "$FB_APP_ID" ] ; then
    echo error: FB_APP_ID not defined - is it in "$PWD/prod-secrets.sh?"
    exit 1
fi

REV=$(git log -1 --oneline | cut -c 1-8)
NOW=$(date)
export FF_BUILD_DESCRIPTION="Art for Breakfast build $REV $NOW"

echo AMP is $AMPLITUDE_API_KEY
echo FB is $FB_APP_ID
echo build description is $FF_BUILD_DESCRIPTION

cd web

npm run build

echo 'ARTIFACTS BUILT, syncing backend to prod'

rsync -av css index.html index.js tos.html privacy.html *.png favicon.ico site.webmanifest $REMOTE_USER:website/

echo 'ARTIFACTS COPIED'
