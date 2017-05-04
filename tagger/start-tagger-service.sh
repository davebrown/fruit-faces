#!/bin/bash

set -e
# useful:
# -R : enable stdio inheritance
# --access-logfile : default None
# --error-logfile : default stderr (?)
# --pythonpath : default None
# --log-config : log config file, default none
# -c : gunicorn config file, default none
# --access-logformat STRING, default [%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"]
# --reload : restart on source change
# --preload: do not go insane debugging startup errors

export FF_MODEL=$PWD/../model_mnist-28x28.h5
export PYTHONFAULTHANDLER=true
gunicorn -b 0.0.0.0:5000 --preload restserver:app \
         --access-logfile=/tmp/tagger/access.log \
         --error-logfile=/tmp/tagger/error.log \
         -c tag-config.py \
         -R

