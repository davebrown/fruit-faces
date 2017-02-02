#!/bin/bash

set -e

DEFAULT_LOG_HOME=$HOME/logs
DEFAULT_CONFIG_FILE=$HOME/production.yaml

LOG_HOME=${FF_LOG_HOME-$DEFAULT_LOG_HOME}
CONFIG_FILE=${FF_CONFIG_FILE-$DEFAULT_CONFIG_FILE}

# PIDFILE env var consumed by the app
export PIDFILE=$LOG_HOME/ff.pid

# set to false to keep stdout/stderr in shell
REDIRECT_DESCRIPTORS=true

usage() {
    echo "usage: $0 {start|status|stop}" 1>&2
    exit 1
}

err() {
    echo ERROR: $@ 1>&2
}
fail() {
    err $*
    exit 1
}

do_status() {
    URL=http://localhost:9080/api/v1/build/revision
    REVISION=$(curl -sS $URL) || fail service at $URL not responding
    echo service at $URL running revision $REVISION
}

# -Djava.util.logging.config.file=${PWD}/java-util-logging.properties \
do_start() {
 java -Ddaemon=true \
     -Dcom.sun.akuma.Daemon.redirectDescriptors=${REDIRECT_DESCRIPTORS} \
     -Dcom.sun.akuma.Daemon.stdoutFile=$LOG_HOME/stdout.log \
     -Dcom.sun.akuma.Daemon.stderrFile=$LOG_HOME/stderr.log \
     -jar $PWD/ff-1.0.0.jar server $CONFIG_FILE
}

do_stop() {
    if [ ! -e "$PIDFILE" ] ; then
        err pid file $PIDFILE does not exist - is ff daemon running?
        exit 1
    fi
    PID=$(cat $PIDFILE)
    rm $PIDFILE
    echo -n stopping ff daemon with process ID ${PID}:
    kill $PID
    sleep 1
    echo done
}

if [ $# -eq 0 ] ; then
    usage
fi

echo looking for and setting logs and PID file below directory $LOG_HOME ...

case $1 in
    start)
        do_start
        ;;

    status)
        do_status
        ;;
    
    stop)
        do_stop
        ;;
    *)
        err "unrecognized argument: $1"
        usage
        ;;
esac

