#!/usr/bin/env python
import sys
import os
import re
from datetime import datetime
import argparse
import json
import exifread
import psycopg2
import psycopg2.extras
import requests
from PIL import Image
from PIL.ExifTags import TAGS
from colorthief import ColorThief
import StringIO
from termcolor import cprint
import traceback

from collections import namedtuple
from math import sqrt
import random

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
  print datetime.now().toordinal()
  print int(datetime.now().strftime("%s")) * 1000 

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

def getTimestamp(imgFile):
  """timestamp value from EXIF data"""
  d = None
  im = Image.open(imgFile)
  for (k,val) in im._getexif().iteritems():
    name = TAGS.get(k)
    if name == 'DateTimeOriginal' or name  == 'DateTimeDigitized':
      d = datetime.strptime(str(val), '%Y:%m:%d %H:%M:%S')
      im.close()
      break

  if d is not None:
    return  int(d.strftime('%s'))
  return -1

  return 
                     
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
    timestamp = getTimestamp(os.path.join(dirname, fname))
    d = {
      'base': base,
      'full': fname
    }
    if timestamp > 0:
      d['timestamp'] = timestamp
      d['tstamp'] = timestamp
      
    ret.append(d)
    with open(ARGS.args[0], 'w') as f:
      f.write(json.dumps(ret))
    
  if ARGS.verbose:
    print json.dumps(ret, indent=2)
  DB = psycopg2.connect("dbname='ff' host='localhost'")
  cur = DB.cursor(cursor_factory=psycopg2.extras.DictCursor)
  for img in ret:
    imgId = cur.execute("""INSERT INTO image (tstamp, base, "full", import_time) values (to_timestamp(%(tstamp)s), %(base)s, %(full)s, NOW());""", img)
  DB.commit()
  DB.close()
  return ret

def cmd_missing_images():
  DB = psycopg2.connect("dbname='ff' host='localhost'")
  cur = DB.cursor(cursor_factory=psycopg2.extras.DictCursor)
  ret = cur.execute("""SELECT id, base FROM image""")
  ret = cur.fetchall()
  missing = []
  for row in ret:
    id, base = row
    print id, base
    thumbFile = os.path.join(ARGS.dir, '%s_60x80_t.jpg' % base)
    if not os.path.exists(thumbFile):
      print 'missing', thumbFile
      missing.append(id)

  print missing
  print 'missing %d/%d' % (len(missing), len(ret))
  
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

def rgb(t):
  return 'rgb(%d, %d, %d)' % (t[0], t[1], t[2])

def colorAverage(palette):
  r = 0
  g = 0
  b = 0
  for c in palette:
    r = r + c[0]
    g = g + c[1]
    b = b + c[2]
  sz = len(palette)
  return (r / sz, g / sz, b / sz)
def thiefFile(f,OUT):
  ct = ColorThief(f)
  verbose('thiefing on ' + f)
  #dom = ct.get_color(quality=5)
  palette = ct.get_palette(color_count=10,quality=1)
  dom = palette[0]
  OUT.write('<tr>\n')
  OUT.write(' <td style="background-color: %s;"><b>DOM</b> %s</td>\n' % (rgb(dom),rgb(dom)))
  avg = colorAverage(palette)
  OUT.write(' <td style="background-color: %s;"><b>AVG</b> %s</td>\n' % (rgb(avg),rgb(avg)))
  for c in palette[1:]:
    OUT.write(' <td style="background-color: %s;">%s</td>\n' % (rgb(c),rgb(c)))
  OUT.write(' <td><img src="%s" width="150" height="200"/></td>\n</tr>\n' % (f))

# heuristic: if b >= 1.4x both r and g, call it blue
def isBlue(pallette):
  FACTOR = 1.4
  for c in pallette:
    r = c[0]
    g = c[1]
    b = c[2]
    if b >= FACTOR * r and b > FACTOR * g:
      return True
  return False

def colorzFile(f,out):
  verbose('colorz on %s:' % f)
  out.write('<tr>\n')
  colors = colorz(f)
  blue = isBlue(colors)
  if blue:
    bs = "BLUE"
  else:
    bs = "NOT BLUE"
  out.write('<td><img src="%s" width="150" height="200"/><br/>%s</td>\n' % (f, bs))
  for c in colors:
    out.write(' <td style="background-color: %s;">%s</td>\n' % (rgb(c),rgb(c)))
  out.write('</tr>\n')
  return blue

def cmd_colors():
  verbose('colors got args: ' + str(ARGS.args))
  if ARGS.dir is None:
    fail('colors requires "--dir" option')
  if ARGS.size is None:
    fail('colors requires "--size" option')
  if len(ARGS.args) < 2:
    err('usage: colors <output-file> [img-path-prefix=""]')
    sys.exit(1)
  out = open(ARGS.args[0], 'w')
  out.write('<html>')
  out.write('  <head><link rel="stylesheet" type="text/css" href="ff.css"/></head>')
  out.write('<body><table>\n')
  def baseMatch(f):
    return f.find('.jpg') > 0 and f.find('_t') < 0

  files = listFiles(ARGS.dir, baseMatch)
  DB = psycopg2.connect("dbname='ff' host='localhost'")
  cur = DB.cursor(cursor_factory=psycopg2.extras.DictCursor)
  for f in files:
    _, fname, base, _2 = paths(f)
    out.write('<tr><td>' + f + '</td></tr>\n')
    #thiefFile(f, out)
    blue = colorzFile(f, out)
    print('%s is blue? %s' % (base, str(blue)))
    if blue:
      cur.execute("""INSERT INTO image_tag (image_id, tag_id) VALUES ('%(img)s', '%(tag)s');""" % {'img': base, 'tag': 'blue' })
      DB.commit()

  out.write('</table></body></html>')
  out.flush()
  out.close()
  cur.close()
  DB.close()
  print('done!')

def cmd_upload():
  if ARGS.dir is None:
    fail('upload requires "--dir" option')
  elif ARGS.auth is None:
    fail('upload requires "--auth" option')
  elif ARGS.url is None:
    fail('upload requires "--url" option')
  files = listFiles(ARGS.dir, fullSizeMatch)

  url = '%s%s' % (ARGS.url, '/api/v1/images')
  verbose('posting files to %s' % url)
  uploads = 0
  exists = 0
  for f in files:
    verbose('%s / %s' % (os.path.basename(f), f))
    fileData = {
      'imagefile': (os.path.basename(f), open(f, 'rb'), 'image/jpeg') # content type assumption
    }

    r = requests.post(url, files=fileData, headers={'X-FF-Auth': ARGS.auth, 'X-FF-Prevent-Duplicates': 'true'}, allow_redirects=False)
    if r.status_code == 303:
      exists = exists + 1
      info('%s already exists: %s' % (os.path.basename(f), r.headers['location']))
      continue
    elif r.status_code != 200:
      raise Exception('non-200 HTTP response %d from %s' % (r.status_code, ARGS.url))
    
    ctype = r.headers['content-type']
    if ctype is None:
      raise Exception('no Content-Type on response from %s' % url)
    elif 'application/json' not in ctype:
      raise Exception('non-JSON content type "%s" on resource %s' % (ctype, ARGS.url))

    dto = r.json()
    print 'uploaded: %s' % str(dto)
    uploads = uploads + 1
    
  info('done - uploaded %d and %d already existed' % (uploads, exists))
  
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

def cmd_colors2():
  ret = colorz(ARGS.args[0])
  print ret

Point = namedtuple('Point', ('coords', 'n', 'ct'))
Cluster = namedtuple('Cluster', ('points', 'center', 'n'))

def get_points(img):
    points = []
    w, h = img.size
    for count, color in img.getcolors(w * h):
        points.append(Point(color, 3, count))
    return points

rtoh = lambda rgb: '#%s' % ''.join(('%02x' % p for p in rgb))

def colorz(filename, n=3):
    img = Image.open(filename)
    img.thumbnail((200, 200))
    w, h = img.size

    points = get_points(img)
    clusters = kmeans(points, n, 1)
    rgbs = [map(int, c.center.coords) for c in clusters]
    return rgbs
    #return map(rtoh, rgbs)

def euclidean(p1, p2):
    return sqrt(sum([
        (p1.coords[i] - p2.coords[i]) ** 2 for i in range(p1.n)
    ]))

def calculate_center(points, n):
    vals = [0.0 for i in range(n)]
    plen = 0
    for p in points:
        plen += p.ct
        for i in range(n):
            vals[i] += (p.coords[i] * p.ct)
    return Point([(v / plen) for v in vals], n, 1)

def kmeans(points, k, min_diff):
    clusters = [Cluster([p], p, p.n) for p in random.sample(points, k)]

    while 1:
        plists = [[] for i in range(k)]

        for p in points:
            smallest_distance = float('Inf')
            for i in range(k):
                distance = euclidean(p, clusters[i].center)
                if distance < smallest_distance:
                    smallest_distance = distance
                    idx = i
            plists[idx].append(p)

        diff = 0
        for i in range(k):
            old = clusters[i]
            center = calculate_center(plists[i], old.n)
            new = Cluster(plists[i], center, old.n)
            clusters[i] = new
            diff = max(diff, euclidean(old.center, new.center))

        if diff < min_diff:
            break

    return clusters

# 9 pixels wide, 8 rows, 72 chars
# empty row above and below
MOBILE_HEART_9 = """
         
 888 888 
888888888
 8888888 
  88888  
   888   
    8    
         
"""

MOBILE_HEART_10 = """
          
 888 888  
888888888 
 8888888  
  88888   
   888    
    8     
          
"""

MOBILE_HEART_11 = """
           
  888 888  
 888888888 
  8888888  
   88888   
    888    
     8     
           
"""

MOBILE_HEART_12 = """
            
   888 888  
  888888888 
   8888888  
    88888   
     888    
      8     
"""

HEART_16 = """
                
  ***     ***   
******* ******* 
*************** 
 *************  
   *********    
     *****      
      ***       
       *        
                
"""

HEART_17 = """
                 
   ***     ***   
 ******* ******* 
 *************** 
  *************  
    *********    
      *****      
       ***       
        *        
                 
"""

HEART_21 = """
                     
   ****       ****   
 *******     ******* 
********** **********
 ******************* 
   ***************   
     ***********     
       *******       
         ***         
          *          
                     
"""
def cmd_heart():
  s = HEART_17
  out = StringIO.StringIO()
  for i in range(len(s)):
    c = s[i]
    if c == ' ':
      out.write('0')
    elif c != '\n':
      out.write('1')
  print out.getvalue()
  print '\nlen:', len(out.getvalue())
    

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
  parser.add_argument('-a', '--auth', help='auth token for remote server', default=None)
  parser.add_argument('-u', '--url', help='url of remote server', default='http://localhost:9080')
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
