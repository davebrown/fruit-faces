#!/bin/bash

LB_HOME=${LIQUIBASE_HOME:=$HOME/apps/liquibase}

POSTGRES_JAR=${POSTGRES_JAR:=$HOME/.m2/repository/postgresql/postgresql/9.1-901-1.jdbc4/postgresql-9.1-901-1.jdbc4.jar}

echo LB_HOME is $LB_HOME
echo PG_JAR is $POSTGRES_JAR
DIR=$(dirname $0)
MIGRATIONS=$DIR/../server/src/main/resources/migrations.postgresql.sql
echo dir is $DIR
echo migrations is $MIGRATIONS

URL=jdbc:postgresql://localhost/ff


$LB_HOME/liquibase --url=$URL \
                   --username=dave \
                   --password=bogus \
                   --changeLogFile=$MIGRATIONS \
                   generateChangeLog
