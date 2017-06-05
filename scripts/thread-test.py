#!/usr/bin/env python

import sys
import os
import traceback

import numpy as np
import skimage.data
from keras.models import Sequential, load_model
#import sklearn
#from keras.layers import Dense, Activation, Dropout, Flatten, Conv2D, MaxPooling2D
#from keras.optimizers import RMSprop, SGD, Adam
#from keras.initializers import RandomNormal, RandomUniform
from keras import backend as K
import tensorflow as tf

import threading

SESSION = None

def loadModel(modelFile):
  # look first for a .h5 file in argv,
  # then look for FF_MODEL in environment
  # then fail
  model = None
  global SESSION
  SESSION = tf.Session()
  K.set_session(SESSION)
  print 'default session, PRE - with', tf.get_default_session()
  with SESSION.as_default():
    print 'default session, POST - with', tf.get_default_session()
    model = load_model(modelFile)
    #print 'end loadModel(), graph is:', GRAPH
    model._make_predict_function()
    #GRAPH.finalize() # avoid modifications
    data = np.array([ skimage.data.imread('/Users/dave/code/fruit-faces/thumbs/IMG_4036_28x28_t.jpg') ] )
    preds = model.predict(data)
  return model

COLORS = [ 'blue', 'gray', 'white' ]

def say(*args):
  name = threading.currentThread().name
  if name is None:
    name = '_no-name_'
  suffix = ' '.join([str(e) for e in args])
  print('<%s> %s' % (name, suffix))
  
def helloWorld(num):
  say('running %d' % num)

def doML(model, imgPath):
  say('running')
  data = np.array([ skimage.data.imread(imgPath) ])
  say('loaded %s shape %s' % (imgPath, str(data.shape)))
  preds = model.predict(data)
  say(' MADE PREDICTIONS: %s ( %s ) !!!' % (COLORS[np.argmax(preds[0], 0)], str(preds)))
  
def main():
  model = loadModel('model_mnist-28x28.h5')
  images = [ 'IMG_2306_28x28_t.jpg', 'IMG_3070_28x28_t.jpg', 'IMG_4111_28x28_t.jpg', 'IMG_5043_28x28_t.jpg', 'IMG_4838_28x28_t.jpg' ]
  for i in range(len(images)):
    imgPath = '/Users/dave/code/fruit-faces/thumbs/%s' % images[i]
    t = threading.Thread(name='thread-%d' % i, target=doML, args=(model, imgPath))
    t.start()

def helloMain():
  say('main running', 1, 2, 3)
  for i in range(5):
    t = threading.Thread(name='thread-%d' % i, target=helloWorld, args=(i,))
    t.start()
  

if __name__ == '__main__':
 # can't do file upload :-(
 # httpd = simple_server.make_server('0.0.0.0', 5000, app)
 # httpd.serve_forever()
  try:
    helloMain()
  except:
    print('EXCEPTION in main')
    traceback.print_exc()
