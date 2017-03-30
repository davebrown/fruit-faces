#!/bin/bash

set -e

# fail prod build if any local edits to working copy
# with -Dmaven.buildNumber.doCheck=true
cd server
mvn -Dmaven.buildNumber.doCheck=true package
cd ..

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

echo AMP is $AMPLITUDE_API_KEY
echo FB is $FB_APP_ID

npm run build

echo 'ARTIFACTS BUILT, syncing backend to prod'

REMOTE_USER=ff@ff.moonspider.com

rsync -av \
      server/target/ff-1.0.0.jar \
      server/production.yaml \
      server/daemon.sh \
      $REMOTE_USER:.

ssh $REMOTE_USER mkdir -p website/thumbs

rsync -av ff.css index.html index.js $REMOTE_USER:website/

rsync -Lav thumbs/ $REMOTE_USER:website/thumbs/

echo '============ STOPPING CURRENT SERVICE ================'

ssh $REMOTE_USER ./daemon.sh stop
sleep 1

echo '========== CHECK AND APPLY DB MIGRATION(S) ==========='

ssh $REMOTE_USER java -jar ff-1.0.0.jar db status production.yaml
ssh $REMOTE_USER java -jar ff-1.0.0.jar db migrate production.yaml

echo '============ STARTING CURRENT SERVICE ================'

ssh $REMOTE_USER ./daemon.sh start

sleep 6

echo '============ CHECKING STATUS =================='

curl -sS https://ff.moonspider.com/api/v1/build | jq .







