#!/usr/bin/env python

import argparse
import sys
import os
import sklearn
import numpy as np
import requests
import json
import threading

# Import helper functions
dir_path = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, dir_path)

import ml_util
from ml_util import info, warn, err, fail, verbose, getJson, join

correct = 0
incorrect = 0

def predictImages(images):
  global correct
  global incorrect
  for i in images:
    verbose(i['base'], ':')
    thumbPath = join(ARGS.dir, '%s_%s_t.jpg' % (i['base'], ARGS.size))
    fileData = {
      'imagefile': open(thumbPath, 'rb')
    }
    r = requests.post(
      ARGS.url,
      files=fileData
      )
    if r.status_code != 200:
      raise Exception('non-200 HTTP response %d from %s' % (r.status_code, ARGS.url))
    ctype = r.headers['content-type']
    if ctype is None:
      raise Exception('no Content-Type on response from %s' % url)
    elif 'application/json' not in ctype:
      raise Exception('non-JSON content type "%s" on resource %s' % (ctype, ARGS.url))

    preds = r.json()['tags']
    # just look for plates now
    for p in preds:
      if p in i['tags']:
        correct = correct + 1
      else:
        info('%s not in %s for %s' % (p, i['tags'], i['base']))
        incorrect = incorrect + 1

  return correct, incorrect
    
def cmd_run(args):
  images = getJson(ARGS.images)
  info('got', len(images), 'image(s)')
  #right, wrong = predictImages(images)
  global correct
  global incorrect
  lists = [ images[0:len(images)/2], images[len(images)/2 + 1:] ]
  threads = []
  for i in range(2):
    t = threading.Thread(name='thread-%d' % i, target=predictImages, args=(lists[i],))
    t.start()
    threads.append(t)
  for i in range(len(threads)):
    info('joining', threads[i].name)
    t.join()
    
  info('got', correct, 'right,', incorrect, 'wrong')
  #for i in images:
  #  info('image:', i['base'])
  
def cmd_hack(args):
  warn('some stuff', 'some numbers', 1, 3, 5, 'more stuff')
  
if __name__ == '__main__':
  global ARGS
  parser = argparse.ArgumentParser(
    description='thumb manager',
    epilog='thumbnail management operations',
    usage="%(prog)s [options] <command> <file(s) or directories>"
    )
  #parser.add_argument('-n', '--dry-run', help='do not actually change anything, but print what I would do', default=False, action="store_true")
  parser.add_argument('-v', '--verbose', help='emit verbose output', default=False, action="store_true")
  parser.add_argument('-s', '--size', help='image size to work with', default='28x28')
  parser.add_argument('-u', '--url', help='URL of REST endpoint', default='http://localhost:5000/api/v1/tags')
  #parser.add_argument('-s', '--size', help='"WxH" dimension', default=None)
  parser.add_argument('-i', '--images', help='image data url', default='http://localhost:9080/api/v1/images')
  parser.add_argument('-d', '--dir', help='local data directory for thumbnail files', default='thumbs')
  parser.add_argument('command', help='hack | run')
  parser.add_argument('args', nargs='*')
  ARGS = parser.parse_args()
  # inform the util module about verbose output or not
  ml_util.VERBOSE_OUTPUT = ARGS.verbose
  verbose("got args %s" % str(ARGS))
  cmd = ARGS.command.replace('-', '_')
  # inform the util module about verbose output or not
  verbose('calling "cmd_' + cmd + '"')
  func = eval('cmd_' + cmd)
  verbose('evaluated to ' + str(func))
  func(ARGS.args)
  sys.exit(0)
