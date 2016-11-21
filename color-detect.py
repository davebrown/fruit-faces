#!/usr/bin/env python

import sys
import os

import struct
from PIL import Image
import scipy
import scipy.misc
import scipy.cluster

from colorthief import ColorThief

def rgb(t):
  return 'rgb(%d, %d, %d)' % (t[0], t[1], t[2])

def sum(l):
  ret = 0
  for n in l:
    ret = ret + n
  print('sum of %s is %d' % (str(l), ret))
  return ret

def thiefFile(f):
  ct = ColorThief(DIR + '/' + f)
  #dom = ct.get_color(quality=5)
  palette = ct.get_palette(color_count=10,quality=2)
  dom = palette[0]
  OUT.write('<tr>\n')
  OUT.write(' <td style="background-color: %s;"><b>DOM</b> %s</td>\n' % (rgb(dom),rgb(dom)))
  for c in palette[1:]:
    OUT.write(' <td style="background-color: %s;">%s</td>\n' % (rgb(c),rgb(c)))
  OUT.write(' <td><img src="%s/%s" width="150" height="200"/></td>\n</tr>\n' % (DIR, f))

global NUM_CLUSTERS
NUM_CLUSTERS = 5.0

def pillowFile(f):
  im = Image.open(f)
  #im = im.resize((300, 150))      # optional, to reduce time
  colors = im.getcolors(1000000 * 10)
  colors = sorted(colors, key=lambda c: c[0], reverse=True)
  dom = colors[0][1]
  fgColor = '#000000'
  if (sum(dom) < 100): fgColor = '#ffffff'
  OUT.write('<tr>\n')
  OUT.write(' <td style="color: %s; background-color: %s;"><b>DOM</b> %s</td>\n' % (fgColor, rgb(dom),rgb(dom)))
#  for c in palette:
#    OUT.write(' <td style="background-color: %s;">%s</td>\n' % (rgb(c),rgb(c)))
  
  i = 1
  while i < 7:
    c = colors[i][1]
    fgColor = 'black'
    if (sum(c) < 150): fgColor = '#ffffff'
    OUT.write(' <td style="color: %s; background-color: %s;">%s</td>\n' % (fgColor,rgb(c),rgb(c)))
    #print(colors[i])
    i = i + 1
  #print(colors)
  #print(len(colors))
  OUT.write(' <td><img src="%s/%s" width="200" height="100"/></td>\n</tr>\n' % (DIR, f))
  im.close()
  #sys.exit(1)

def pillowFile_2(f):
  im = Image.open(f)
  #im = im.resize((150, 150))      # optional, to reduce time
  ar = scipy.misc.fromimage(im)
  shape = ar.shape
  ar = ar.reshape(scipy.product(shape[:2]), shape[2])

  print 'finding clusters'
  codes, dist = scipy.cluster.vq.kmeans(ar, NUM_CLUSTERS)
  print 'cluster centres:\n', codes

  vecs, dist = scipy.cluster.vq.vq(ar, codes)         # assign codes
  counts, bins = scipy.histogram(vecs, len(codes))    # count occurrences

  index_max = scipy.argmax(counts)                    # find most frequent
  peak = codes[index_max]
  colour = ''.join(chr(c) for c in peak).encode('hex')
  print 'most frequent is %s (#%s)' % (peak, colour)

def batch(args):  
  OUT.write('<html><body><table>\n')
  for f in os.listdir(DIR):
    if (f.find('JPG') < 0 and f.find('jpg') < 0) or  f.find('_t') > 0:
      continue
    print(f)
    if True: 
      thiefFile(f)
    else:
      pillowFile(f)

  OUT.write('</table></body></html>');
  OUT.close()

def paths(f):
  dirpath, fname = os.path.split(f)
  base, ext = os.path.splitext(fname)
  return dirpath, fname, base, ext
  
def scaleImage(args):
  print(args)
  if len(args) == 0:
    sys.stderr.write('usage: prog <image-file>')
    sys.exit(1)

  im = Image.open(args[0])
  dirname, fname,  base, ext = paths(args[0])
  # typically 3024 x 4032
  sz = im.size
  thumb = im.resize( (sz[0] / 100, sz[1] / 100) )
  im.close()
  thumbName = base + '_t' + ext
  outPath = os.path.join(dirname, thumbName)
  print('saving thumb to %s' % outPath)
  thumb.save(outPath)
  thumb.close()

global DIR
DIR = os.environ['HOME'] + '/pics/exported'
global OUT
OUT = open(DIR + '/thumbs-scales-20x27.html', 'w')

def doThumbs(scaleDown=100, size=None, ncols=40):
  print('scaling down %d' % scaleDown)
  OUT.write('Scale down %d<br/>\n' % scaleDown)
  OUT.write('<table><tr>\n')
  wroteSize = False
  count = 0
  for f in os.listdir(DIR):
    if (f.find('JPG') < 0 and f.find('jpg') < 0) or f.find('_t') > 0:
      continue
    im = Image.open(os.path.join(DIR, f))
    dirname, fname,  base, ext = paths(os.path.join(DIR, f))
    # typically 3024 x 4032
    sz = im.size
    thumb = None
    if size is None:
      thumb = im.resize( (sz[0] / scaleDown, sz[1] / scaleDown) )
    else:
      thumb = im.resize( (size[0], size[1] ) )
    im.close()
    sz = thumb.size
    thumbName = base + '_' + str(sz[0]) + 'x' + str(sz[1]) + '_t' + ext
    outPath = os.path.join(dirname, thumbName)
    print('saving thumb to %s' % outPath)
    thumb.save(outPath)
    thumb.close()
#    if not wroteSize:
#      OUT.write('<td>' + str(sz[0]) + 'x' + str(sz[1]) + '</td>\n')
#      wroteSize = True
    OUT.write('  <td><img src="file://%s"/></td>\n' % outPath)
    count = count + 1
    if count % ncols == 0:
      OUT.write('</tr><tr>\n')
  OUT.write('</tr></table>\n')

def thumbSingle(scaleDown=100):
  print('scaling down %d' % scaleDown)
  OUT.write('Scale down %d<br/>\n' % scaleDown)
  OUT.write('<table><tr>\n')
  path = '/Users/dave/pics/exported/IMG_4551-circle.png'
  im = Image.open(path)
  dirname, fname,  base, ext = paths(path)
  # typically 3024 x 4032
  sz = im.size
  thumb = im.resize( (sz[0] / scaleDown, sz[1] / scaleDown) )
  im.close()
  sz = thumb.size
  thumbName = base + '_' + str(sz[0]) + 'x' + str(sz[1]) + '_t' + ext
  outPath = os.path.join(dirname, thumbName)
  print('saving thumb to %s' % outPath)
  thumb.save(outPath)
  thumb.close()
  OUT.write('<td>' + str(sz[0]) + 'x' + str(sz[1]) + '</td>\n')
  wroteSize = True
  for i in range(10):
    OUT.write('  <td><img src="file://%s"/></td>\n' % outPath)
  OUT.write('</tr></table>\n')

def thumbSingles():
  OUT.write('<html><body style="background-color: #a0a0a0;">\n')
  thumbSingle(300)
  thumbSingle(250)
  thumbSingle(200)
  thumbSingle(150)
  thumbSingle(120)
  thumbSingle(100)
  thumbSingle(80)
  thumbSingle(60)
  thumbSingle(50)
  thumbSingle(40)
  OUT.write('</body></html>\n')
  
def thumbDir():
  OUT.write('<html><body>\n')
  OUT.write('  <head><link rel="stylesheet" type="text/css" href="ff.css"/></head>')

#  doThumbs(200, size=(15,20), ncols=40)
  doThumbs(-1, size=(20,27), ncols=30)
#  doThumbs(100, size=(30,40), ncols=20)

#  doThumbs(300)
#  doThumbs(250)
#  doThumbs(200)
#  doThumbs(150)
#  doThumbs(120)
#  doThumbs(100)
#  doThumbs(80)
#  doThumbs(60)
#  doThumbs(50)
#  doThumbs(40)
  OUT.write('</body></html>\n')
  
if __name__ == '__main__':
#  thumbSingles()
  thumbDir()
  
  

