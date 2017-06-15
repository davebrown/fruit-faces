import sys
import os
from os.path import dirname, join
import time

from fabric.api import env, local, run, get
from fabric.context_managers import cd, shell_env, lcd
#from fabric.operations import put

env.hosts = [ 'ff@ff.moonspider.com' ]

def backup(localDir='%s/%s' % (os.environ['HOME'], 'ff-backup')):
  print('saving backup files to %s' % localDir)
  local('mkdir -p %s' % localDir)
  with lcd(localDir):
    dumpfile = 'ff_db_%s.dump' % time.strftime('%Y-%m-%d_%H:%M', time.gmtime())
    run('pg_dump -f %s ff' % (dumpfile))
    #get('thumb-manager.py', local_path='thumb-manager.py')
    get(dumpfile, local_path=dumpfile)
    local('echo hello world')
    local('rsync -av %s:website/thumbs ./' % env.hosts[0]) # hack
  
