import os
import csv

def join(a,b):
  return os.path.join(a,b)

BASEDIR = os.path.abspath(join(os.path.dirname(__file__), '..'))

IMAGEDIR = join(BASEDIR, 'thumbs')

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
  ret = []
  for a in array:
    ret.append(a[ind])
  return ret

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
    probStr = ''
    if probs is not None:
      probStr = '<br/><code>p(G)=%.3f<br/>p(W)=%.3f<br/> p(B)=%.3f</code>' % (probs[i][0], probs[i][1], probs[i][2])
    html.write('<td><img src="%s/%s"/><br/>predicted: <b>%s</b><br/>actual: <b>%s</b><br/>%s%s</td>\n' % (IMAGEDIR, imageFiles[i], pc, ac, verdict, probStr))
  html.write('</tr></td></table></html>')
  html.flush()
  html.close()
