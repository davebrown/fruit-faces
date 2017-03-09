#!/usr/bin/env python

import argparse
import sys
import os
import csv
import sklearn
import skimage, skimage.data, skimage.transform
import numpy as np

def join(a,b):
  return os.path.join(a,b)

BASEDIR = os.path.abspath(join(os.path.dirname(__file__), '..'))

IMAGEDIR = join(BASEDIR, 'thumbs')

def loadCSV(file):
  """read CSV as list of lists"""
  with open(join(BASEDIR, file), 'rb') as f:
    reader = csv.reader(f)
    return list(reader)

def loadFileLines(file):
  """read file as list of lines"""
  with open(join(BASEDIR, file), 'rb') as f:
    ret = f.readlines()
    ret = [ s.rstrip() for s in ret ]
    return ret

def thumbFile(full):
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
      probStr = '<code>p(G)=%.3f<br/>p(W)=%.3f<br/> p(B)=%.3f</code>' % (probs[i][0], probs[i][1], probs[i][2])
    html.write('<td><img src="%s/%s"/><br/>predicted: <b>%s</b><br/>actual: <b>%s</b><br/>%s%s</td>\n' % (IMAGEDIR, imageFiles[i], pc, ac, verdict, probStr))
    if i > 0 and i % 5 == 0:
      html.write('</tr><tr>\n')
  html.write('</tr></td></table></html>')
  html.flush()
  html.close()
  
trainedData = loadCSV('trained-plates.csv')
testData = loadFileLines('test-plates.csv')

trainedImages = []
for datum in trainedData:
  img = skimage.data.imread(join(IMAGEDIR, thumbFile(datum[0])))
  #print('shape: %s min: %d max: %d' % (str(img.shape), img.min(), img.max()))
  #datum.append(img)
  #images.append(img)
  trainedImages.append(np.array(img).flatten())

trainedLabels = [ c2n(d[1]) for d in trainedData ]  

trainedImages = np.array(trainedImages)
trainedLabels = np.array(trainedLabels)

testImages = []
print('loading %d test image(s)' % len(testData))
for file in testData:
  print('  loading %s:' % file)
  img = skimage.data.imread(join(IMAGEDIR, thumbFile(file)))
  #testImages.append(img)
  testImages.append(np.array(img).flatten())

testImages = np.array(testImages)

print 'plate data and label and test data shapes:', trainedImages.shape, trainedLabels.shape, testImages.shape

from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import BayesianRidge, ElasticNet, ElasticNetCV
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn import datasets, metrics

iris = datasets.load_iris()
print type(iris), type(iris.data), type(iris.target)
print 'data shape:', iris.data.shape, 'target shape:', iris.target.shape
print iris.target

classifier = GaussianNB() # 92.6% correct on training data set, wrong between white <-> gray
classifier = LogisticRegression() # 100% correct on training, empirically worse on test data tho
#classifier = ElasticNet()
#classifier.fit(iris.data, iris.target)
#score = metrics.accuracy_score(iris.target, classifier.predict(iris.data))
#print("Accuracy: %f" % score)

classifier.fit(trainedImages, trainedLabels)
predicts = classifier.predict(trainedImages)
print 'predictions:', type(predicts)
print predicts
score = metrics.accuracy_score(trainedLabels, predicts)
print("Accuracy on training set: %f" % score)

outputHtml('sklearn-classified.html', [ i[0] for i in trainedData ], [ n2c(p) for p in predicts ], [ c[1] for c in trainedData ])

predicts = classifier.predict(testImages)
outputHtml('sklearn-unclassified.html', testData, [ n2c(p) for p in predicts ], [ 'unknown' for i in range(len(testData)) ], None )
