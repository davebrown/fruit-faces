#!/usr/bin/env python

import argparse
import sys
import os
import sklearn
import skimage, skimage.data
import numpy as np

# Import helper functions
dir_path = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, dir_path)

import ml_util as u
from ml_util import n2c, c2n, info, warn, err, fail, verbose

from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import BayesianRidge, ElasticNet, ElasticNetCV
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn import metrics
from sklearn.multioutput import MultiOutputClassifier

def getTags():
  ret = u.getJson('/tags')
  ret = [ 'blue', 'white', 'gray', 'strawberry' ]
  return ret

def tag2n(img, tag):
  if u.imageHasTag(img, tag):
    return 1
  return 0

def loadInputs():
  json = u.getJson('/images')
  tags = getTags()
  data = np.empty( (len(json), 60 * 80 * 3 ) ) # keep in sync with 60x80 in 'thumbFile'
  labels = np.empty( (len(json), len(tags) ) ) 
  for i in range(len(json)):
    img = json[i]
    imgData = skimage.data.imread(u.thumbFile(img['full']))
    data[i] = np.array(imgData).flatten()
    labels[i] = np.array([ tag2n(img, t) for t in tags ])
    
  return [ img['full'] for img in json ], data, labels

def cmd_run(args):
  imageFiles, imageData, labels = loadInputs()
  # see multi-label learning comment below. for now, slice() to one label
  TAG_INDEX = 3 # 3 == strawberry
  labels = u.slice(labels, TAG_INDEX)
  NO_YES = [ 'NO ' + getTags()[TAG_INDEX], 'YES ' + getTags()[TAG_INDEX] ]
  verbose('data shape: %s labels shape: %s' % (imageData.shape, labels.shape))
  trainedFiles, testFiles = u.split(imageFiles, 326)
  trainedImages, testImages = u.split(imageData, 326)
  trainedLabels, testLabels = u.split(labels, 326)
  # some classifiers can only handle a single target
  # http://stackoverflow.com/questions/31881138/predicting-outcome-of-multiple-targets-in-scikit-learn
  # try this? http://scikit-learn.org/stable/modules/generated/sklearn.multioutput.MultiOutputClassifier.html
  verbose('trained data shape: %s trained labels shape: %s' % (trainedImages.shape, trainedLabels.shape))
  classifier = GaussianNB() # 92.6% correct on training data set, wrong between white <-> gray
  #classifier = LogisticRegression() # 100% correct on training, empirically worse on test data tho
  #classifier = ElasticNet()
  classifier.fit(trainedImages, trainedLabels)
  predicts = classifier.predict(testImages)
  print 'predicts.shape:', predicts.shape
  print predicts
  probs = classifier.predict_proba(testImages)
  print 'probs shape:', probs.shape
  print 'testLabels', testLabels
  htmlFile = 'strawberry-unclassified.html'
  u.outputHtml(htmlFile, testFiles, [ NO_YES[int(p)] for p in predicts ], [ NO_YES[int(i)] for i in testLabels ], None)
  info('saved test results: %s' % htmlFile)
  #probs = classifier.predict_log_proba(testImages)
  #print 'probs log shape:', probs.shape
  #print 'PROBS log', probs

  #u.outputHtml('sklearn-unclassified.html', [ i[0] for i in testData ], [ n2c(p) for p in predicts ], [ c[1] for c in testData ], probs )
  
  
  
def cmd_hack(args):
  info('hack called with args %s' % str(args))
  warn('this is a warning')
  err('this is an error')
  info('this is merely info')
  print getTags()
  a, b = u.split([ i for i in range(20) ], 17)
  print a
  print b
  fail('now you\'ve done it')
  
if __name__ == '__main__':
  global ARGS
  parser = argparse.ArgumentParser(
    description='thumb manager',
    epilog='thumbnail management operations',
    usage="%(prog)s [options] <command> <file(s) or directories>"
    )
  #parser.add_argument('-n', '--dry-run', help='do not actually change anything, but print what I would do', default=False, action="store_true")
  parser.add_argument('-v', '--verbose', help='emit verbose output', default=False, action="store_true")
  #parser.add_argument('-s', '--size', help='"WxH" dimension', default=None)
  #parser.add_argument('-d', '--dir', help='directory for scan or output', default=None)
  parser.add_argument('command', help='hack | train')
  parser.add_argument('args', nargs='*')
  ARGS = parser.parse_args()
  verbose("got args %s" % str(ARGS))
  cmd = ARGS.command.replace('-', '_')
  # inform the util module about verbose output or not
  u.VERBOSE_OUTPUT = ARGS.verbose
  verbose('calling "cmd_' + cmd + '"')
  func = eval('cmd_' + cmd)
  verbose('evaluated to ' + str(func))
  func(ARGS.args)
  sys.exit(0)
  
