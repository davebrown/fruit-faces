import os
import sys
import csv
import requests
from termcolor import cprint
import numpy as np
import skimage.data
from sklearn.preprocessing import LabelBinarizer

# Import helper functions from '../tagger'
dir_path = os.path.dirname(os.path.realpath(__file__))
#sys.path.insert(0, dir_path)
dir_path = os.path.join(dir_path, '../tagger')
sys.path.insert(0, dir_path)

from tag_util import n2c, c2n, getTags, decodeSize
from imread import imread

def join(a,b):
  if len(b) > 0 and b[0] == '/':
    b = b[1:]
  return os.path.join(a,b)

BASEDIR = os.path.abspath(join(os.path.dirname(__file__), '..'))

IMAGEDIR = join(BASEDIR, 'thumbs')

FF_URL = 'http://localhost:9080/api/v1'

TTY = sys.stdout.isatty()

VERBOSE_OUTPUT = False

def info(*args):
  msg = ' '.join([str(e) for e in args])
  sys.stdout.write(msg)
  sys.stdout.write('\n')
  sys.stdout.flush()

def warn(*args):
  msg = ' '.join([str(e) for e in args])
  if TTY:
    cprint(msg, 'yellow', file=sys.stderr, attrs=['bold'], end='\n')
  else:
    sys.stderr.write(msg)
    sys.stderr.write('\n')

def err(*args):
  msg = ' '.join([str(e) for e in args])
  if TTY:
    cprint(msg, 'red', attrs=['bold'], file=sys.stderr, end='\n')
  else:
    sys.stderr.write(msg)
    sys.stderr.write('\n')

def fail(*args):
  msg = ' '.join([str(e) for e in args])
  err('%s\nexiting...' % msg)
  sys.exit(1)
  
def verbose(*args):
  msg = ' '.join([str(e) for e in args])
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

def catSummary(preds):
  """plate color prediction text summary"""
  counts = np.count_nonzero(preds, 0)
  ret = ''
  for i in range(len(counts)):
    ret = ret + '%d %s ' % (counts[i], n2c(i))
  return ret
    
def imageHasTag(img, tag):
  if img and img['tags']:
#    for t in img['tags']:
#      if t == tag:
#        return True
    return tag in img['tags']
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

def thumbFile(relPath, imageDim):
  full = join(IMAGEDIR, relPath)
  base, ext = os.path.splitext(full)
  return base + '_' + imageDim + '_t.jpg';

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


def tag2n(img, tag):
  if imageHasTag(img, tag):
    return 1
  return 0

def loadInputs(flatten=True, imageDim='60x80', imgId=None):
  if imgId is None:
    json = getJson('/images')
  else:
    json = [ getJson('/images/%s' % imgId) ]
    
  tags = getTags()
  width, height = decodeSize(imageDim)

  if (flatten):
    data = np.empty( (len(json), width * height * 3 ) )
  else:
    data = np.empty( ( len(json), width, height, 3 ) )

  labels = np.empty( (len(json), len(tags) ) ) 
  for i in range(len(json)):
    img = json[i]
    imgData = imread(thumbFile(img['full'], imageDim))
    #print('imgData shape', imgData.shape, 'type', type(imgData))
    
    if flatten:
      data[i] = np.array(imgData).flatten()
    else:
      data[i] = imgData
    labels[i] = np.array([ tag2n(img, t) for t in tags ])
    
  return [ img['full'] for img in json ], data, labels, json
  
# make 1-hot array
# http://stackoverflow.com/questions/29831489/numpy-1-hot-array
#def oneHot(arr, width):
#  # note: I think width needs to be max value in 'arr'
#  a = np.array(arr)
#  b = np.zeros((len(arr), width))
#  b[np.arange(len(arr)), a] = 1
#  return b

def oneHot(textLabels, textData):
  """one-hot encoding of a list of unique labels, and 1-dim list of data"""
  lb = LabelBinarizer()
  a = lb.fit(textLabels)
  #print 'One-hot classes:', lb.classes_
  yhot = lb.fit_transform(textData)
  #print 'yhot', type(yhot), '\n', yhot
  return yhot

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



def sample(lists, percent):
  if percent <= 0.0 or percent >= 1.0:
    raise Exception('percent must be > 0.0 and < 1.0, not %f' % percent)

  listlen = len(lists[0])
  for l in lists[1:]:
    if len(l) != listlen:
      raise Exception('lists must all be equal length, got %d != %d' % (listlen, len(l)))

  
def tupleTest():
  return range(3)
if __name__ == '__main__':
  a,b,c = tupleTest()
  print a, b, c
