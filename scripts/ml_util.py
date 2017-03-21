import os
import sys
import csv
import requests
from termcolor import cprint
import numpy as np
import skimage.data

def join(a,b):
  if len(b) > 0 and b[0] == '/':
    b = b[1:]
  return os.path.join(a,b)

BASEDIR = os.path.abspath(join(os.path.dirname(__file__), '..'))

IMAGEDIR = join(BASEDIR, 'thumbs')

FF_URL = 'http://localhost:9080/api/v1'

TTY = sys.stdout.isatty()

VERBOSE_OUTPUT = False

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
  err('%s\nexiting...' % msg)
  sys.exit(1)
  
def verbose(msg):
  #print('  (...verbose entry "%s"...)' % msg)
  if not VERBOSE_OUTPUT: return
  if TTY:
    cprint(msg, 'grey', attrs=['bold'], end='\n')
  else:
    sys.stdout.write(msg)
    sys.stdout.write('\n')
    sys.stdout.flush()

def getJson(url):
  """url can be absolute or relative to FF service"""
  if not url.startswith('http://') and not url.startswith('https://'):
    url = join(FF_URL, url)
  #verbose('getting URL: %s' % url)
  r = requests.get(url)
  if r.status_code != 200:
    raise Exception('non-200 HTTP response %d from %s' % (r.status_code, url))
  ctype = r.headers['content-type']
  if ctype is None:
    raise Exception('no Content-Type on response from %s' % url)
  elif 'application/json' not in ctype:
    raise Exception('non-JSON content type "%s" on resource %s' % (ctype, url))

  return r.json()

def imageHasTag(img, tag):
  if img and img['tags']:
    for t in img['tags']:
      if t == tag:
        return True
  return False
    
def loadCSV(relPath):
  """read CSV as list of lists"""
  with open(join(BASEDIR, relPath), 'rb') as f:
    reader = csv.reader(f)
    return list(reader)

def loadFileLines(relPath):
  """read file as list of lines"""
  with open(join(BASEDIR, relPath), 'rb') as f:
    ret = f.readlines()
    ret = [ s.rstrip() for s in ret ]
    return ret

def thumbFile(relPath):
  full = join(IMAGEDIR, relPath)
  base, ext = os.path.splitext(full)
  return base + '_60x80_t.jpg';

def slice(array, ind):
  """return a column as array from a 2d array"""
  # try to match type of caller
  ret = []
  if type(array) == np.ndarray:
    return array[:,ind]
    ret = np.empty(len(array))
  for i in range(len(array)):
    ret[i].append(array[i][ind])
  return ret

def split(nparray, ind):
  a = nparray[:ind]
  b = nparray[ind:]
  return a, b

def c2n(c):
    if c == 'blue': return 2
    if c == 'white': return 1
    if c == 'gray': return 0
    raise ValueError('unknown color: "%s"' % c)

def n2c(n):
    if n == 0: return 'gray'
    if n == 1: return 'white'
    if n == 2: return 'blue'
    raise ValueError('unknown color numeric: "%d"' % n)

def getTags():
  #ret = getJson('/tags')
  ret = [ 'blue', 'white', 'gray', 'strawberry' ]
  return ret

def tag2n(img, tag):
  if imageHasTag(img, tag):
    return 1
  return 0

def loadInputs():
  json = getJson('/images')
  tags = getTags()
  data = np.empty( (len(json), 60 * 80 * 3 ) ) # keep in sync with 60x80 in 'thumbFile'
  labels = np.empty( (len(json), len(tags) ) ) 
  for i in range(len(json)):
    img = json[i]
    imgData = skimage.data.imread(thumbFile(img['full']))
    data[i] = np.array(imgData).flatten()
    labels[i] = np.array([ tag2n(img, t) for t in tags ])
    
  return [ img['full'] for img in json ], data, labels
  
# make 1-hot array
# http://stackoverflow.com/questions/29831489/numpy-1-hot-array
def oneHot(arr, width):
  # note: I think width needs to be max value in 'arr'
  a = np.array(arr)
  b = np.zeros((len(arr), width))
  b[np.arange(len(arr)), a] = 1
  return b

def outputHtml(filename, imageFiles, predictedColors, actualColors, probs=None):
  html = open(filename, 'w')
  html.write('<html>\n')
  html.write("""    <style>
      img {
      width: 120px;
      height: 160px;
      }
      .wrong { color: red; font-weight: bold; }
    </style>
""")
  html.write('<body>\n<table><tr>\n')
  correctCount = 0
  for i in range(len(imageFiles)):
    if i > 0 and i % 5 == 0:
      html.write('</tr><tr>\n')
    pc = predictedColors[i]
    ac = actualColors[i]
    verdict = ''
    if ac is not None and ac is not 'unknown':
      if pc != ac:
        verdict = '<span class="wrong">WRONG</span>'
      else:
        verdict = '<b>CORRECT</b>'
        correctCount = correctCount + 1
    probStr = ''
    if probs is not None:
      probStr = '<br/><code>p(G)=%.3f<br/>p(W)=%.3f<br/> p(B)=%.3f</code>' % (probs[i][0], probs[i][1], probs[i][2])
    html.write('<td><img src="%s/%s"/><br/>predicted: <b>%s</b><br/>actual: <b>%s</b><br/>%s%s</td>\n' % (IMAGEDIR, imageFiles[i], pc, ac, verdict, probStr))

  html.write('</tr></td></table>')
  html.write('<b>%d of %d correct - %.3f%%</b>' % (correctCount, len(imageFiles), 100 * float(correctCount) / float(len(imageFiles))))
  html.write('</html>')
  html.flush()
  html.close()
