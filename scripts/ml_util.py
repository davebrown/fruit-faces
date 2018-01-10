import os
import os.path
import sys
import csv
import requests
from termcolor import cprint
import numpy as np
import skimage.data
from sklearn.preprocessing import LabelBinarizer
import keras.utils
import random

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

IMAGEDIR = join(BASEDIR, 'web/thumbs/1')

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
  verbose('getting URL: %s' % url)
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

def thumbFile(relPath, imageDim, rot=''):
  full = join(IMAGEDIR, relPath)
  base, ext = os.path.splitext(full)
  return base + '_' + imageDim + '_t.jpg';

def thumbBase(base, imageDim, rot=''):
  return join(IMAGEDIR, base + '_' + imageDim + rot + '_t.jpg')

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

TAGS = getTags()
NUM_CLASSES = len(TAGS)

def inferBase(full):
  ret = os.path.splitext(full)[0]
  ret = ret.replace('_480x640', '').replace('_t', '')
  return ret

class TrainingSet:

  def _emptyCTOR(self):
    self.images = []
    self.np_plates = None
    self.np_data = None
    self.np_labels = None

  def __init__(self, json, dim, flatten=True):
    if json is None:
      self._emptyCTOR()
      return
    self.images = []
    for img in json:
      self.images.append(TrainingImage(img, dim, flatten))
      for rot in [ '_rot90', '_rot180', '_rot270' ]:
        self.images.append(TrainingImage(img, dim, flatten, rot))

    plates = [ c2n(img.getPlateColor()) for img in self.images ]
    self.np_plates = keras.utils.to_categorical(plates, NUM_CLASSES)
    #random.seed(11)
    #random.shuffle(self.images)
    width, height = decodeSize(dim)

    if (flatten):
      self.np_data = np.empty( (len(self.images), width * height * 3 ) )
    else:
      self.np_data = np.empty( ( len(self.images), width, height, 3 ) )
    self.np_labels = np.empty( (len(self.images), len(TAGS)) )
    i = 0
    for img in self.images:
      self.np_data[i] = img.np_data
      self.np_labels[i] = img.np_label
      i += 1

  def __str__(self):
    return '{TrainingSet size=%d}' % len(self.images)

  def split(self, percent=.75):
    if type(percent) != float:
      raise ValueError('expect float for percent, not %s' % str(type(percent)))
    idx = int(percent * len(self.images))
    # we have 4 samples of each image, b/c rotation, so make sure it is
    # a multiple of 4
    idx += (idx % 4)
    #print('Training set split index: %d type %s' % (idx, str(type(idx))))
    a = TrainingSet(None, None)
    b = TrainingSet(None, None)
    a.images, b.images = split(self.images, idx)
    a.np_plates, b.np_plates = split(self.np_plates, idx)
    a.np_data, b.np_data = split(self.np_data, idx)
    a.np_labels, b.np_labels = split(self.np_labels, idx)
    return a, b

class TrainingImage:

  def __init__(self, json, dim, flatten=True, rot=''):
    #self.base = json['base']
    self.full = json['full']
    self.tags = json['tags']
    self.base = inferBase(self.full)
    self.filePath = thumbBase(self.base, dim, rot)
    if not os.path.exists(self.filePath):
      raise Exception('file does not exist: %s' % self.filePath)

    self.np_data = imread(self.filePath)
    if flatten:
      self.np_data = np.array(self.np_data).flatten()
    self.np_label = np.array([ tag2n(json, t) for t in TAGS ])

  def __str__(self):
    return '{base: %s filePath: %s}' % (self.base, self.filePath)

  def getPlateColor(self):
    for c in ['blue', 'gray', 'white']:
      if c in self.tags:
        return c
    raise Exception('image %s has no plate color tag (has: %s)' % (img['base'], img.get('tags', None)))

def loadInputs2(flatten=True, imageDim='28x28'):
  json = getJson('/images/1')
  #ret = [ TrainingImage(img, imageDim) for img in json ]
  ret = TrainingSet(json, imageDim, flatten)
  return ret

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
    thumb = thumbBase(img['base'], imageDim)
    imgData = imread(thumb)
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

def outputHtml2(filename, imageFiles, predictedColors, actualColors, probs=None):
  html = open(filename, 'w')
  html.write('<html>\n')
  html.write("""    <style>
      img {
      width: 120px;
      height: 120px;
      }
      .wrong { color: red; font-weight: bold; }
    </style>
""")
  html.write('<body>\n<table><tr>\n')
  correctCount = 0
  for i in range(len(imageFiles)):
    if i > 0 and i % 4 == 0:
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
    #html.write('<td><img src="%s/%s"/><br/>predicted: <b>%s</b><br/>actual: <b>%s</b><br/>%s%s</td>\n' % (IMAGEDIR, imageFiles[i], pc, ac, verdict, probStr))
    html.write('<td><img src="%s"/><br/>predicted: <b>%s</b><br/>actual: <b>%s</b><br/>%s%s</td>\n' % (imageFiles[i], pc, ac, verdict, probStr))

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
