#!/bin/bash

# hack: source production venv
echo 'sourcing virtualenv for tagger:'
. ~/venvs/tagger/bin/activate

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
# -D, --daemon - detach from terminal, enter background
# -p <FILE>, --pid <FILE> - write pid file
DIR=$(dirname $0)
export FF_MODEL=$DIR/model_mnist-28x28.h5
mkdir -p $HOME/logs

if [ "$#" != "1" ] ; then
    echo error: no arg given 1>&2
    echo usage: $0 '< start | stop >' 1>&2
    exit 1
fi

fail() {
    echo 'FAILED: ' $* 1>&2
    echo 'exiting...' 1>&2
    exit 1
}

do_start() {
    echo starting...
    cd $DIR
    gunicorn -b 0.0.0.0:5000 --preload restserver:app \
             --access-logfile=$HOME/logs/tagger-access.log \
             --error-logfile=$HOME/logs/tagger-error.log \
             --pythonpath $DIR \
             --daemon --pid $DIR/tagger.pid
    sleep 3
    echo started tagger, PID:
    cat $DIR/tagger.pid || echo 'warning: no pid file?'
}

do_stop() {
    echo killing pid in $DIR/tagger.pid...
    if [ -e "$DIR/tagger.pid" ] ; then
        PID=$(cat $DIR/tagger.pid)
        echo killing $PID
        kill $PID || fail kill $PID failed
        sleep 1
        echo 'stopped(?)'
    else
        echo 'error: no pid file $DIR/tagger.pid - is tagger running?' 1>&2
        exit 1
    fi
}

case "$1" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    *)
        echo unknown command: $1 1>&2
        echo I know how to start or stop 1>&2
        exit 1
        ;;
esac

exit 0

#export PYTHONFAULTHANDLER=true

