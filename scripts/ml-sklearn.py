#!/usr/bin/env python

import argparse
import sys
import os
import sklearn
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

def cmd_train(args):
  if len(args) == 0:
    err('error: not enough arguments.')
    err('usage: run <classify-tag>')
    sys.exit(1)
  tag = args[0]
  tags = u.getTags()
  if tag not in tags:
    fail('error: tag "%s" not found.\nKnown tags are: %s' % (tag, str(tags)))

  info('classifying for tag "%s"' % tag)
  imageFiles, imageData, labels, imageJson = u.loadInputs()
  # see multi-label learning comment below. for now, slice() to one label
  labels = u.slice(labels, tags.index(tag))
  NO_YES = [ 'NO ' + tag, 'YES ' + tag ]
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
  #classifier = KNeighborsClassifier() # not as good as GaussianNB, particularly false positives/negatives on blue
  #classifier = ElasticNet()
  classifier.fit(trainedImages, trainedLabels)
  predicts = classifier.predict(testImages)
  verbose('predicts.shape: %s' % str(predicts.shape))
  #print predicts
  probs = classifier.predict_proba(testImages)
  verbose('probs shape: %s' % str(probs.shape))
  verbose('testLabels: %s' % str(testLabels))
  htmlFile = tag + '-gaussian-unclassified.html'
  u.outputHtml(htmlFile, testFiles, [ NO_YES[int(p)] for p in predicts ], [ NO_YES[int(i)] for i in testLabels ], None)
  info('saved test results: %s' % htmlFile)
  #probs = classifier.predict_log_proba(testImages)
  #print 'probs log shape:', probs.shape
  #print 'PROBS log', probs

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
  
