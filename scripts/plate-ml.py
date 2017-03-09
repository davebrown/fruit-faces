#!/usr/bin/env python2

import sys
import os
import csv
import sklearn
import skimage, skimage.data, skimage.transform
import numpy as np
import tensorflow as tf

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
    if n == 2: return 'blue'
    if n == 1: return 'white'
    if n == 0: return 'gray'
    raise ValueError('unknown color numeric: "%d"' % n)

trainedData = loadCSV('trained-plates.csv')
testData = loadFileLines('test-plates.csv')

#print trainedData
print testData

images = []
for datum in trainedData:
  #print('reading %s:' % datum[0])
  img = skimage.data.imread(join(IMAGEDIR, thumbFile(datum[0])))
  #print('shape: %s min: %d max: %d' % (str(img.shape), img.min(), img.max()))
  #datum.append(img)
  images.append(img)

labels_a = np.array([ c2n(d[1]) for d in trainedData ])
images_a = np.array(images)

testImages = []
print('loading %d test image(s)' % len(testData))
for file in testData:
  #print('  loading %s:' % file)
  img = skimage.data.imread(join(IMAGEDIR, thumbFile(datum[0])))
  testImages.append(img)

testImages_a = np.array(testImages)

print 'labels:', labels_a.shape, 'images:', images_a.shape, 'test-images:', testImages_a.shape

# Create a graph to hold the model.
graph = tf.Graph()

# Create model in the graph.
with graph.as_default():
  # Placeholders for inputs and labels.
  images_ph = tf.placeholder(tf.float32, [None, 80, 60, 3])
  print('images_ph shape', images_ph.shape)
  labels_ph = tf.placeholder(tf.int32, [None])

  # Flatten input from: [None, height, width, channels]
  # To: [None, height * width * channels] == [None, 3072]
  images_flat = tf.contrib.layers.flatten(images_ph)
  print('images_flat shape', images_flat.shape)
  

  # Fully connected layer. 
  # Generates logits of size [None, 3]
  logits = tf.contrib.layers.fully_connected(images_flat, 3, tf.nn.relu)
  print('logits shape', logits.shape)

  # Convert logits to label indexes (int).
  # Shape [None], which is a 1D vector of length == batch_size.
  predicted_labels = tf.argmax(logits, 1)
  print('predicted_labels shape', predicted_labels.shape)

  # Define the loss function. 
  # Cross-entropy is a good choice for classification.
  loss = tf.reduce_mean(tf.nn.sparse_softmax_cross_entropy_with_logits(logits = logits, labels = labels_ph))
  #loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits = logits, labels = labels_ph))

  # Create training op.
  train = tf.train.AdamOptimizer(learning_rate=0.001).minimize(loss)
  #train = tf.train.GradientDescentOptimizer(0.5).minimize(loss)

  # And, finally, an initialization op to execute before training.
  # TODO: rename to tf.global_variables_initializer() on TF 0.12.
  #init = tf.initialize_all_variables()
  init = tf.global_variables_initializer() #.run()

  print("images_flat: ", images_flat)
  print("logits: ", logits)
  print("loss: ", loss)
  print("predicted_labels: ", predicted_labels)    

  # Create a session to run the graph we created.
  session = tf.Session(graph=graph)


  # First step is always to initialize all variables. 
  # We don't care about the return value, though. It's None.
  _ = session.run([init])

  for i in range(251):
    _, loss_value = session.run([train, loss], 
                                feed_dict={images_ph: images_a, labels_ph: labels_a})
    if i % 10 == 0:
        print("Loss: ", loss_value)


  predicted = session.run([predicted_labels], feed_dict={images_ph: testImages_a})[0]

  for i in range(len(testImages)):
    print(' %s predicted %d/%s' % (testData[i], predicted[i], n2c(predicted[i])))

#predicted = session.run([predicted_labels], feed_dict={images_ph: images_a})[0]
  
#for i in range(len(images_a)):
#  print(' %s predicted %d/%s' % (trainedData[i][0], predicted[i], n2c(predicted[i])))
  
  
  

