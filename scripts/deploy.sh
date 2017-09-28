#!/bin/bash

set -e

REMOTE_USER=ff@ff.moonspider.com

# sync and build tagger service
echo '============ SYNC TAGGER SERVICE AND DEPENDENCIES ================'
ssh $REMOTE_USER mkdir -p tagger
cd tagger
rsync -av *.py requirements.txt model_plates-28x28.h5 tagger-prod.sh $REMOTE_USER:tagger/
cd ..
# assume here that deploy machine already provisioned with:
# 1) python 2.7
# 2) python-pip
# 3) virtualenv
# 4) a virtualenv called 'tagger' already exists and is sourced from .bashrc
ssh $REMOTE_USER '. venvs/tagger/bin/activate && pip install -r tagger/requirements.txt'

echo '============ RESTART TAGGER SERVICE ================'
ssh $REMOTE_USER 'tagger/tagger-prod.sh stop || true'
sleep 1

ssh $REMOTE_USER 'cd tagger && ./tagger-prod.sh start'
echo waiting 15s for tagger to start: && sleep 15
ssh $REMOTE_USER '(curl -s http://localhost:5000/api/v1/ping | grep OK) || (echo ERROR tagger not OK && exit 1)'

echo '============ RESTARTED TAGGER SERVICE ================'

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

REV=$(git log -1 --oneline | cut -c 1-8)
NOW=$(date)
export FF_BUILD_DESCRIPTION="Art for Breakfast build $REV $NOW"

echo AMP is $AMPLITUDE_API_KEY
echo FB is $FB_APP_ID
echo build description is $FF_BUILD_DESCRIPTION

cd web
npm run build

echo 'ARTIFACTS built, syncing frontend to prod'
ssh $REMOTE_USER mkdir -p website/thumbs

rsync -av css index.html index.js tos.html privacy.html $REMOTE_USER:website/


cd ..
echo 'syncing backend to prod'

rsync -av \
      server/target/ff-1.0.0.jar \
      server/production.yaml \
      server/daemon.sh \
      $REMOTE_USER:.


#rsync -Lav thumbs/ $REMOTE_USER:website/thumbs/

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







