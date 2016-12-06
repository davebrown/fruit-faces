#!/usr/bin/env python
import sys
import os
import re
from datetime import datetime
#import datetime from datetime
import argparse
import json
import exifread

from PIL import Image
from PIL.ExifTags import TAGS
from colorthief import ColorThief

#import psycopg2

from termcolor import cprint
import traceback

TTY = sys.stdout.isatty()

def info(msg):
  sys.stdout.write(msg)
  sys.stdout.write('\n')
  sys.stdout.flush()

def warn(msg):
  if TTY:
    cprint(msg, 'yellow', file=sys.stderr, attrs=['bold'], end='\n')
  else:
    sys.stderr.write(msg)
    sys.stderr.write('\n')

def err(msg):
  if TTY:
    cprint(msg, 'red', attrs=['bold'], file=sys.stderr, end='\n')
  else:
    sys.stderr.write(msg)
    sys.stderr.write('\n')

def fail(msg):
  err('%s : exiting...' % msg)
  sys.exit(1)
  
def verbose(msg):
  #print('  (...verbose entry "%s"...)' % msg)
  if not ARGS.verbose: return
  if TTY:
    cprint(msg, 'grey', attrs=['bold'], end='\n')
  else:
    sys.stdout.write(msg)
    sys.stdout.write('\n')
    sys.stdout.flush()

def decodeSize(sz):
  try:
    w,h = sz.split('x', 2)
    w = int(w)
    h = int(h)
    return w, h
  except ValueError as ve:
    fail('invalid dimension "%s"' % sz)

def cmd_hack():
  s = "20x27"
  if len(ARGS.args) > 0:
    s = ARGS.args[0]
  w,h = decodeSize(s)
  print('decoded size (%d X %d)' % (w, h))
  cprint('THIS SHOULD BE GRAY', 'grey', end='\n')

def _defaultMatchFunc(f):
  if f.find('.JPG') > 0 or f.find('.jpg') > 0:
    return True
  return False

def fullSizeMatch(f):
  if (f.find('.jpg') > 0 or f.find('.JPG') > 0) and f.find('_t') < 0: # not a thumbnail
    return True
  return False

def listFiles(dirname, matchFunc=_defaultMatchFunc):
  ret = []
  for f in os.listdir(dirname):
    if matchFunc(f):
      ret.append(os.path.join(dirname, f))
      
  return ret

def paths(f):
  dirpath, fname = os.path.split(f)
  base, ext = os.path.splitext(fname)
  return dirpath, fname, base, ext

def cmd_exif():
  with open(ARGS.args[0], 'rb') as f:
    tags = exifread.process_file(f)
  for name in tags.keys():
    if name.find('Time') > -1 and False:
      val = tags[name]
      print name,val
      try:
        if name == 'EXIF DateTimeOriginal' or name == 'EXIF DateTimeDigitized':
          print 'parsing', val
          # "2014:08:07 06:23:58"
          d = datetime.strptime(str(val), '%Y:%m:%d %H:%M:%S')
          print 'parsed date:', name, d, 'original"', val, '"', d.strftime('%A, %B %d, %Y %I:%M %p'), d.toordinal()
      except:
        print('could not parse date: "%s"="%s"' % (name, val))
        traceback.print_exc()

  im = Image.open(ARGS.args[0])
  for (k,val) in im._getexif().iteritems():
    name = TAGS.get(k)
    if name == 'DateTimeOriginal' or name  == 'DateTimeDigitized':
      print 'parsing', val
      # "2014:08:07 06:23:58"
      d = datetime.strptime(str(val), '%Y:%m:%d %H:%M:%S')
      print 'parsed date:', name, d, 'original"', val, '"', d.strftime('%A, %B %d, %Y %I:%M %p'), d.toordinal()
      #print '%s = %s' % (TAGS.get(k), v)
  im.close()

def getDateString(imgFile):
  dateStr = 'Unknown!'
  im = Image.open(imgFile)
  for (k,val) in im._getexif().iteritems():
    name = TAGS.get(k)
    if name == 'DateTimeOriginal' or name  == 'DateTimeDigitized':
      d = datetime.strptime(str(val), '%Y:%m:%d %H:%M:%S')
      im.close()
      dateStr = d.strftime('%A, %B %d, %Y %I:%M %p')
      break

  return dateStr
                     
def cmd_json():
  """make a JSON catalogue of all images base name"""
  ret = []
  if len(ARGS.args) != 1:
    err('error! usage: json -d <image-dir> <json-output-file>')
    fail('check usage')
    
  if ARGS.dir is None:
    fail('json requires "--dir" option')

  files = listFiles(ARGS.dir, fullSizeMatch)
  for f in files:
    dirname, fname, base, ext = paths(f)
    dateStr = getDateString(os.path.join(dirname, fname))
    d = {
      'base': base,
      'full': fname,
      'timestamp': dateStr
    }
    ret.append(d)
    with open(ARGS.args[0], 'w') as f:
      f.write(json.dumps(ret))
    
  if ARGS.verbose:
    print json.dumps(ret, indent=2)
  return ret

# FIXME: handle landscape vs portrait?
def cmd_make_thumbs():
  verbose('make-thumbs got args: ' + str(ARGS.args))
  if ARGS.dir is None:
    fail('make-thumbs requires "--dir" option')
  if ARGS.size is None:
    fail('make-thumbs requires "--size" option')

  thumbwidth, thumbheight = decodeSize(ARGS.size)
  files = listFiles(ARGS.dir, fullSizeMatch)
  for f in files:
    im = Image.open(f)
    dirname, fname,  base, ext = paths(f)
    # typically 3024 x 4032
    #sz = im.size
    thumb = im.resize( (thumbwidth, thumbheight) )
    im.close()
    sz = thumb.size
    thumbName = base + '_' + str(sz[0]) + 'x' + str(sz[1]) + '_t' + ext
    outPath = os.path.join(dirname, thumbName)
    print('saving thumb to %s' % outPath)
    thumb.save(outPath)
    thumb.close()

  print('created %d thumbnail(s)' % len(files))

def cmd_thumb_page():
  verbose('thumb-page got args: ' + str(ARGS.args))
  if ARGS.dir is None:
    fail('thumb-page requires "--dir" option')
  if ARGS.size is None:
    fail('thumb-page requires "--size" option')
  if len(ARGS.args) < 2:
    err('usage: thumbs-page <ncols> <output-file> [img-path-prefix=""]')
    sys.exit(1)
  ncols = int(ARGS.args[0])

  def thumbMatch(f):
    if f.find('.jpg') > 0 and f.find(ARGS.size + '_t') >= 0:
      return True
    return False
  
  thumbs = listFiles(ARGS.dir, thumbMatch)
  if len(thumbs) == 0:
    fail('no .jpg thumbs matching "' + ARGS.size + '"')
  info('making table of %d thumbs with %d per row' % (len(thumbs), ncols))
  thumbwidth, _ = decodeSize(ARGS.size)
  out = open(ARGS.args[1], 'w')
  pathPrefix = ""
  if len(ARGS.args) > 2:
    pathPrefix = ARGS.args[2]
  out.write('<html>')
  out.write('  <head><link rel="stylesheet" type="text/css" href="ff.css"/></head>')
  out.write('<body><h2>%d columns, table width %dpx<br/>\n%d total images</h2><br/>\n<table>\n' % (ncols, ncols * thumbwidth, len(thumbs)))

  out.write('<tr>')
  for i in range(ncols):
    out.write('<td><b>%d</b></td>' % (i+1))
  out.write('</tr>')
  count = 0
  rowOpen = False
  for count in range(len(thumbs)):
    if not rowOpen:
      out.write('<tr>\n')
      rowOpen = True
    _, fname, basename, _2 = paths(thumbs[count])
    out.write('<td><img onClick="thumbClickHandler(\'%s\');" src="%s%s"/></td>' % (basename, pathPrefix, fname))
    if (count+1) % ncols == 0:
      out.write('</tr>')
      rowOpen = False
  if rowOpen: out.write('</tr>')
  out.write('</table></body></html>')
  out.close()
    
def main():
  global ARGS
  parser = argparse.ArgumentParser(
    description='thumb manager',
    epilog='thumbnail management operations',
    usage="%(prog)s [options] <command> <file(s) or directories>"
    )
  HOME = os.environ['HOME']
  parser.add_argument('-n', '--dry-run', help='do not actually change anything, but print what I would do', default=False, action="store_true")
  parser.add_argument('-v', '--verbose', help='emit verbose output', default=False, action="store_true")
  parser.add_argument('-s', '--size', help='"WxH" dimension', default=None)
  parser.add_argument('-d', '--dir', help='directory for scan or output', default=None)
  parser.add_argument('command', help='thumbs')
  parser.add_argument('args', nargs='*')
  ARGS = parser.parse_args()
  verbose("got args %s" % str(ARGS))
  cmd = ARGS.command.replace('-', '_')
  try:
    verbose('calling "cmd_' + cmd + '"')
    func = eval('cmd_' + cmd)
    verbose('evaluated to ' + str(func))
    func()
  except NameError:
    err("invalid command: '%s'" % cmd)
    if ARGS.verbose:
      traceback.print_exc()


if __name__ == '__main__':
  main()
