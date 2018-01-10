#!/usr/bin/env python

import argparse
import sys
import os
import sklearn
import numpy as np

# Import helper functions
dir_path = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, dir_path)
dir_path = os.path.join(dir_path, '../tagger')
sys.path.insert(0, dir_path)

import ml_util as u
from ml_util import info, warn, err, fail, verbose
import tag_util as tu
from tag_util import n2c, c2n
from imread import imread

import keras.utils
from keras.models import Sequential, load_model
from keras.layers import Dense, Activation, Dropout, Flatten, Conv2D, MaxPooling2D
from keras.optimizers import RMSprop, SGD, Adam
from keras.initializers import RandomNormal, RandomUniform
from keras import backend as K

import tensorflow as tf

def getPlateColor(img):
  for c in ['blue', 'gray', 'white']:
    if u.imageHasTag(img, c):
      return c
  raise Exception('image %s has no plate color tag (has: %s)' % (img['base'], img.get('tags', None)))

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

  input_shape = (width, height, 3)
  
  model = Sequential()
  init = RandomUniform(minval=-0.1, maxval=.1)
  model.add(Conv2D(32, kernel_size=(3, 3),
                   activation='relu',
                   kernel_initializer=init,
                   data_format='channels_last',
                   input_shape=input_shape))
  model.add(Conv2D(64, (3, 3), activation='relu',
                   data_format='channels_last', kernel_initializer='random_normal'))
  model.add(MaxPooling2D(pool_size=(2, 2)))
  model.add(Dropout(0.25))
  model.add(Flatten())
  model.add(Dense(128,
                  kernel_initializer=init,
                  activation='relu'))
  model.add(Dropout(0.5))
  model.add(Dense(NUM_CLASSES, activation='softmax'))

  # baseline: 100% in training, 87% in test (gray and cutting board blue mis-identified as white)
  # without Dropout: 100% in training, 91% in test (all gray mis-identified as white)
  # with rotations (3x data size) 100% training, 91.2% test
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

def cmd_predict(args):
  if ARGS.file is None:
    fail('need file argument with -f | --file to load trained model (and perhaps run "train" first?)')

  if args is None or len(args) == 0:
    fail('must specify image(s) to make predictions on!')
  
  model = load_model(ARGS.file)
  print('model loaded from %s' % ARGS.file)
  model.summary()
  
  FLAT_DATA = True
  # FIXME: hack
  if ARGS.model == 'mnist':
    FLAT_DATA = False

  verbose('flattening data? %s' % str(FLAT_DATA))
  for imgId in args:
    print('predict on %s' % imgId)
    # FIXME: parameterize dimension, or attach to persisted model somehow?
    files, data, labels, json = u.loadInputs(FLAT_DATA, '28x28', imgId)
    print 'predicting on shape %s' % str(data.shape)
    predicts = model.predict(data)
    predictedPlate = n2c(predicts[0])
    truePlate = n2c(labels[0])
    print('%s: predicted %s truth %s' % (imgId, predictedPlate, truePlate))

def cmd_train2(args):

  if ARGS.file is None:
    fail('need file argument with -f | --file to save trained model')

  # fix seed for reproducibility
  np.random.seed(8)

  FLAT_DATA = True

  width, height = tu.decodeSize(ARGS.size)

  # wrap all keras ops in a know TF session
  sess = tf.Session()
  K.set_session(sess)
  model = make_model(ARGS.model, width, height)
  # FIXME: hack
  if ARGS.model == 'mnist':
    FLAT_DATA = False

  verbose('model summary:')
  model.summary()

  fullSet = u.loadInputs2(FLAT_DATA, ARGS.size)
  # sanity check!
  if len(fullSet.np_labels[0]) != NUM_CLASSES:
    raise Exception('labels length (%d) != expected num_classes (%d)' % (len(fullSet.np_labels[0]), NUM_CLASSES))

  trainSet, testSet = fullSet.split(.75)

  info('trainSet', trainSet, 'testSet', testSet)

  verbose('trained data shape: %s trained labels shape: %s' % (trainSet.np_data.shape, trainSet.np_labels.shape))
  model.fit(trainSet.np_data, trainSet.np_plates, epochs=ARGS.epochs, batch_size=100)

  predicts = model.predict(testSet.np_data)

  u.outputHtml2('plates-test2.html', [ img.filePath for img in testSet.images ], [ n2c(p) for p in predicts ], [ n2c(i) for i in testSet.np_plates ])

  predicts = model.predict(trainSet.np_data)

  u.outputHtml2('plates-train2.html', [ img.filePath for img in trainSet.images ], [ n2c(p) for p in predicts ], [ n2c(i) for i in trainSet.np_plates ])
  
def cmd_train(args):

  if ARGS.file is None:
    fail('need file argument with -f | --file to save trained model')
    
  # fix seed for reproducibility
  np.random.seed(8)

  FLAT_DATA = True
  
  width, height = tu.decodeSize(ARGS.size)

  # wrap all keras ops in a know TF session
  sess = tf.Session()
  K.set_session(sess)
  model = make_model(ARGS.model, width, height)
  # FIXME: hack
  if ARGS.model == 'mnist':
    FLAT_DATA = False

  verbose('model summary:')
  model.summary()

  imageFiles, imageData, labels, imgJson = u.loadInputs(FLAT_DATA, ARGS.size)

  # sanity check!
  if len(labels[0]) != NUM_CLASSES:
    raise Exception('labels length (%d) != expected num_classes (%d)' % (len(labels[0]), NUM_CLASSES))
  
  verbose('data shape: %s labels shape: %s' % (imageData.shape, labels.shape))

  plates = [ c2n(getPlateColor(img)) for img in imgJson ]
  print('plates PRE', plates)
  plates = keras.utils.to_categorical(plates, NUM_CLASSES)
  print('plates POST', plates)

  splitIndex = 326
  trainedFiles, testFiles = u.split(imageFiles, splitIndex)
  trainedImages, testImages = u.split(imageData, splitIndex)
  trainedLabels, testLabels = u.split(labels, splitIndex)
  trainedY, testY = u.split(plates, splitIndex)

  verbose('trained data shape: %s trained labels shape: %s' % (trainedImages.shape, trainedLabels.shape))
    
  print 'before fit(), trainedImages.shape', trainedImages.shape, 'trainedY.shape', trainedY.shape
  model.fit(trainedImages, trainedY, epochs=ARGS.epochs, batch_size=100)

  #K.set_learning_phase(0) # all new operations will be in test mode from now on
  
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

  model.save(ARGS.file)
  print('trained model saved to %s' % ARGS.file)
  
  # try save/load of only tf graph
  saver = tf.train.Saver()
  savePath = saver.save(sess, '/tmp/my-model.ckpt')
  print('saved tf session to %s' % savePath)
  
def cmd_load(args):
  # wrap all keras ops in a know TF session
  with tf.Session() as sess:
    K.set_session(sess)
    width, height = u.decodeSize(ARGS.size)
    model = make_model(ARGS.model, width, height)
    print 'initializing session'
    saver = tf.train.Saver()
    saver.restore(sess, '/tmp/my-model.ckpt')
    print 'loaded session!', sess, 'with graph', sess.graph

    vars = tf.global_variables()
    print 'session global variables', vars
    for v in vars:
      print v.name, type(v)

    vars = tf.local_variables()
    print 'session local variables', vars
    for v in vars:
      print v.name, type(v)

    
    #prediction = tf.argmax(y, 1)
    
    
  
def _abort_this():  
  # save the tf graph as 'predict-only'
  # https://blog.keras.io/keras-as-a-simplified-interface-to-tensorflow-tutorial.html#exporting-a-model-with-tensorflow-serving
  previous_model = model
  K.set_learning_phase(0)  # all new operations will be in test mode from now on

  # serialize the model and get its weights, for quick re-building
  config = previous_model.get_config()
  print ('config is', config)
  weights = previous_model.get_weights()

  # re-build a model where the learning phase is now hard-coded to 0
  from keras.models import model_from_config
  #new_model = model_from_config(config)
  new_model = Sequential.from_config(config)
  new_model.set_weights(weights)  

  from tensorflow_serving.session_bundle import exporter

  export_path = '/tmp/my-model.ckpt' # where to save the exported graph
  export_version = 1 # version number (integer)

  saver = tf.train.Saver(sharded=True)
  model_exporter = exporter.Exporter(saver)
  signature = exporter.classification_signature(input_tensor=model.input,
                                                scores_tensor=model.output)
  model_exporter.init(sess.graph.as_graph_def(),
                      default_graph_signature=signature)
  model_exporter.export(export_path, tf.constant(export_version), sess)
  
  #probs = classifier.predict_log_proba(testImages)
  #print 'probs log shape:', probs.shape
  #print 'PROBS log', probs

  #u.outputHtml('sklearn-unclassified.html', [ i[0] for i in testData ], [ n2c(p) for p in predicts ], [ c[1] for c in testData ], probs )
  
def cmd_hack(args):
  tset = u.loadInputs2(True, '28x28')
  print len(tset.images), 'image(s)'
  print tset.images[0]
  print tset.images[0].np_data.dtype
  sys.exit(1)
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
  parser.add_argument('-m', '--model', help='mnist, mnist2, iris', default='mnist', required=False)
  parser.add_argument('-e', '--epochs', help='# epochs to run', type=int, default=5)
  parser.add_argument('-f', '--file', help='save/load model from file')
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
  
