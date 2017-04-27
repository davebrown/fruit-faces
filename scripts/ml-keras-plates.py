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

import keras.utils
from keras.models import Sequential
from keras.layers import Dense, Activation, Dropout, Flatten, Conv2D, MaxPooling2D
from keras.optimizers import RMSprop, SGD, Adam
from keras.initializers import RandomNormal, RandomUniform

def getPlateColor(img):
  for c in ['blue', 'gray', 'white']:
    if u.imageHasTag(img, c):
      return c
  raise Exception('image %s has no plate color tag' % img['base'])

NUM_CLASSES = 3

def make_model_simple(width=80, height=60):
  iShape = (width * height * 3,)
  model = Sequential()

  init = RandomUniform(minval=-0.5, maxval=.5)
  #init = RandomNormal(mean=0.0, stddev=0.05, seed=None)
  optimizier = SGD(lr=.0001)
  optimizer = RMSprop(lr=0.0001)
  model.add(Dense(NUM_CLASSES, activation='softmax', input_shape=iShape, use_bias=True,
                  kernel_initializer=init, bias_initializer='zeros'))

  model.compile(loss='categorical_crossentropy',
                optimizer = optimizer,
                metrics=['accuracy'])

  return model

# has some problems. adapted from:
# http://machinelearningmastery.com/multi-class-classification-tutorial-keras-deep-learning-library/
def make_model_iris(width=80, height=60):
  model = Sequential() 
  #model.add(Dense(None, input_dim = 14400))
  #model.add(Activation('relu'))
  inputs = width * height * 3
  model.add(Dense(inputs, input_dim=inputs, kernel_initializer='normal', activation='relu'))
  model.add(Dense(NUM_CLASSES, kernel_initializer='normal', activation='sigmoid'))

  info('model built, compiling')
  model.compile(optimizer='rmsprop',
              loss='categorical_crossentropy',
              metrics=['accuracy'])
  return model

# adapted from mnist_cnn.py in keras examples dir
def make_model_mnist(width=80, height=60):

  input_shape = (1, width * height * 3)
  input_shape = (width, height, 3)
  
  model = Sequential()
  init = RandomUniform(minval=-0.1, maxval=.1)
  model.add(Conv2D(32, kernel_size=(3, 3),
                   activation='relu',
                   #kernel_initializer=init,
                   input_shape=input_shape))
  model.add(Conv2D(64, (3, 3), activation='relu', data_format='channels_last'))
  model.add(MaxPooling2D(pool_size=(2, 2)))
  model.add(Dropout(0.25))
  model.add(Flatten())
  model.add(Dense(128,
                  #kernel_initializer=init,
                  activation='relu'))
  model.add(Dropout(0.5))
  
  model.add(Dense(NUM_CLASSES, activation='softmax'))

  model.compile(loss=keras.losses.categorical_crossentropy,
                optimizer=keras.optimizers.Adadelta(),
                metrics=['accuracy'])
  # full network above: loss: 6.7255 - acc: 0.5767
  # keeping only Conv2D(32), Conv2D(64), Flatten(), and Dense(num_classes): loss: 9.5918 - acc: 0.4049
  return model
  
def make_model_mnist2(width=80, height=60):
  iShape = (width, height, 3)
  iShape = (width * height * 3,)
  init = RandomUniform(minval=-0.1, maxval=.1)
  model = Sequential()
  model.add(Dense(512, activation='relu', input_shape=iShape, kernel_initializer=init))
  model.add(Dropout(0.2))
  model.add(Dense(512, activation='relu', kernel_initializer=init))
  model.add(Dropout(0.2))
  model.add(Dense(NUM_CLASSES, activation='softmax', kernel_initializer=init))

  model.compile(loss='categorical_crossentropy',
                optimizer=RMSprop(),
                metrics=['accuracy'])
  return model

MODELS = {
  'mnist': make_model_mnist,
  'mnist2': make_model_mnist2,
  'iris': make_model_iris,
  'simple': make_model_simple
}
def make_model(mname, width, height):
  func = MODELS.get(mname, None)
  if func is None:
    raise Exception('no model named "%s"' % mname)

  return func(width, height)

def cmd_run(args):

  # fix seed for reproducibility
  np.random.seed(8)

  FLAT_DATA = True
  
  width, height = u.decodeSize(ARGS.size)
  model = make_model(ARGS.model, width, height)
  if ARGS.model == 'mnist':
    FLAT_DATA = False
    
  # if not USE_MNIST:
  #   model = make_model_iris(width, height)
  # elif False:
  #   model = make_model_mnist2(width, height)
  # else:
  #   model = make_model_mnist2(width, height)
  
  imageFiles, imageData, labels, imgJson = u.loadInputs(FLAT_DATA, ARGS.size)

  # sanity check!
  if len(labels[0]) != NUM_CLASSES:
    raise Exception('labels length (%d) != expected num_classes (%d)' % (len(labels[0]), NUM_CLASSES))
  verbose('data shape: %s labels shape: %s' % (imageData.shape, labels.shape))

  plates = [ c2n(getPlateColor(i)) for i in imgJson ]
  print('plates PRE', plates)
  plates = keras.utils.to_categorical(plates, NUM_CLASSES)
  print('plates POST', plates)

  splitIndex = 326
  trainedFiles, testFiles = u.split(imageFiles, splitIndex)
  trainedImages, testImages = u.split(imageData, splitIndex)
  trainedLabels, testLabels = u.split(labels, splitIndex)
  trainedY, testY = u.split(plates, splitIndex)

  verbose('trained data shape: %s trained labels shape: %s' % (trainedImages.shape, trainedLabels.shape))

  verbose('model summary:')
  model.summary()
    
  # Convert labels to categorical one-hot encoding
  # think I've done the equivalent of this in the slice() above (?)
  #binaryTrainedLabels = keras.utils.to_categorical(labels, num_classes=10)
  #model.fit(trainedImages, trainedLabels, epochs=10, batch_size=splitIndex)
  print 'before fit(), trainedImages.shape', trainedImages.shape, 'trainedY.shape', trainedY.shape
  model.fit(trainedImages, trainedY, epochs=ARGS.epochs, batch_size=100)


  #verbose('model.get_config()')
  #print(model.get_config())
  weights = model.get_weights()
  print '=== model weights === shape=', weights[0].shape
  #print '=== model weights ==='
  #print(weights)
  
  predicts = model.predict(testImages)
  verbose('predicts.shape: %s' % str(predicts.shape))
  verbose('predicts[0] type %s' % type(predicts[0]))
  #print('predicts content', predicts)

  probs = model.predict_proba(testImages)
  verbose('probs shape: %s' % str(probs.shape))
  #print 'probs', probs
  htmlFile = 'plates-unclassified.html'
  u.outputHtml(htmlFile, testFiles, [ n2c(p) for p in predicts ], [ n2c(i) for i in testY ], None)
  info('saved test results: %s' % htmlFile)
  print 'test truth summary:', u.catSummary(testY)
  print 'test prediction summary:', u.catSummary(predicts)

  predicts = model.predict(trainedImages)
  htmlFile = 'plates-classified.html'
  u.outputHtml(htmlFile, trainedFiles, [ n2c(p) for p in predicts ], [ n2c(i) for i in trainedY ], None)
  info('saved trained verify results: %s' % htmlFile)
  print 'trained truth summary:', u.catSummary(trainedY)
  print 'trained prediction summary:', u.catSummary(predicts)
  
  #probs = classifier.predict_log_proba(testImages)
  #print 'probs log shape:', probs.shape
  #print 'PROBS log', probs

  #u.outputHtml('sklearn-unclassified.html', [ i[0] for i in testData ], [ n2c(p) for p in predicts ], [ c[1] for c in testData ], probs )
  
  
  
def cmd_hack(args):
  info('hack called with args %s' % str(args))
  warn('this is a warning')
  err('this is an error')
  info('this is merely info')
  a, b = u.split([ i for i in range(20) ], 17)
  print a
  print b
  nda = np.array([0,0,1])
  print(nda)
  print(n2c(nda))
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
  parser.add_argument('-s', '--size', help='image size to work with', default='60x80')
  parser.add_argument('-m', '--model', help='mnist, mnist2, iris', required=True)
  parser.add_argument('-e', '--epochs', help='# epochs to run', type=int, default=5)
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
  
