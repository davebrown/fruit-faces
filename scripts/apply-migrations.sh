#!/bin/bash

function usage {
    cat <<EOF | cat
usage: $0 <command>

commands:
  generateChangeLog - bootstrap changelog from existing state
  changelogSync - mark all changes as executed in DB
  changelogSyncSQL - emit SQL for the above to stdout, do not change DB
  update - apply migrations
  validate - see if there are any errors in changelog
  status (--verbose) see what changesets need to be applied
EOF
    exit 1
}

LB_HOME=${LIQUIBASE_HOME:=$HOME/apps/liquibase}

POSTGRES_JAR=${POSTGRES_JAR:=$HOME/.m2/repository/postgresql/postgresql/9.1-901-1.jdbc4/postgresql-9.1-901-1.jdbc4.jar}

URL=jdbc:postgresql://localhost/ff

#echo LB_HOME is $LB_HOME
#echo PG_JAR is $POSTGRES_JAR
DIR=$(dirname $0)
MIGRATIONS=$DIR/../server/src/main/resources/migrations.postgresql.sql

if [ $# -lt 1 ] ; then
    echo error: command required
    usage $0
fi    

#echo dir is $DIR
echo using migrations file $MIGRATIONS


$LB_HOME/liquibase --classpath $POSTGRES_JAR --url=$URL \
                   --username=dave \
                   --password=bogus \
                   --changeLogFile=$MIGRATIONS \
                   $*


