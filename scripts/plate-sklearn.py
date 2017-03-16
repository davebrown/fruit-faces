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
from ml_util import n2c, c2n

trainedData = u.loadCSV('trained-plates.csv')
testData = u.loadFileLines('test-plates.csv')

trainedImages = []
for datum in trainedData:
  img = skimage.data.imread(u.thumbFile(datum[0]))
  #print('shape: %s min: %d max: %d' % (str(img.shape), img.min(), img.max()))
  #datum.append(img)
  #images.append(img)
  trainedImages.append(np.array(img).flatten())

trainedLabels = [ u.c2n(d[1]) for d in trainedData ]  

trainedImages = np.array(trainedImages)
trainedLabels = np.array(trainedLabels)

testImages = []
print('loading %d test image(s)' % len(testData))
for file in testData:
  print('  loading %s:' % file)
  img = skimage.data.imread(u.thumbFile(file))
  #testImages.append(img)
  testImages.append(np.array(img).flatten())

testImages = np.array(testImages)

print 'plate data and label and test data shapes:', trainedImages.shape, trainedLabels.shape, testImages.shape

from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import BayesianRidge, ElasticNet, ElasticNetCV
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn import datasets, metrics

classifier = GaussianNB() # 92.6% correct on training data set, wrong between white <-> gray
#classifier = LogisticRegression() # 100% correct on training, empirically worse on test data tho
#classifier = ElasticNet()
#classifier.fit(iris.data, iris.target)
#score = metrics.accuracy_score(iris.target, classifier.predict(iris.data))
#print("Accuracy: %f" % score)

classifier.fit(trainedImages, trainedLabels)
predicts = classifier.predict(trainedImages)
probs = classifier.predict_proba(trainedImages)
print 'predictions:', type(predicts)
print predicts
score = metrics.accuracy_score(trainedLabels, predicts)
print("Accuracy on training set: %f" % score)

tmp = trainedData[:326]
testData = trainedData[326:]
trainedData = tmp
u.outputHtml('sklearn-classified.html', [ i[0] for i in trainedData ], [ n2c(p) for p in predicts ], [ c[1] for c in trainedData ], probs)

predicts = classifier.predict(testImages)
probs = classifier.predict_proba(testImages)
print 'probs shape:', probs.shape

#probs = classifier.predict_log_proba(testImages)
#print 'probs log shape:', probs.shape
#print 'PROBS log', probs

#outputHtml('sklearn-unclassified.html', testData, [ n2c(p) for p in predicts ], [ 'unknown' for i in range(len(testData)) ], probs )
u.outputHtml('sklearn-unclassified.html', [ i[0] for i in testData ], [ n2c(p) for p in predicts ], [ c[1] for c in testData ], probs )
