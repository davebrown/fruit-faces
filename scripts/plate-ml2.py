"""A very simple MNIST classifier.
See extensive documentation at
http://tensorflow.org/tutorials/mnist/beginners/index.md
"""
#from __future__ import absolute_import
#from __future__ import division
#from __future__ import print_function

import argparse
import sys
import os
import csv
import sklearn
import skimage, skimage.data, skimage.transform
import numpy as np

#from tensorflow.examples.tutorials.mnist import input_data

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

#print trainedData
#sys.exit(1)
#print testData

images = []
for datum in trainedData:
  #print('reading %s:' % datum[0])
  img = skimage.data.imread(join(IMAGEDIR, thumbFile(datum[0])))
  #print('shape: %s min: %d max: %d' % (str(img.shape), img.min(), img.max()))
  #datum.append(img)
  #images.append(img)
  images.append(np.array(img).flatten())

print 'skimage loaded type: ', type(images[0])  
#labels_a = np.array([ c2n(d[1]) for d in trainedData ])
labels_a = [ c2n(d[1]) for d in trainedData ]
#print labels_a
labels_a = oneHot(labels_a, 3)
#print labels_a
#sys.exit(1)

print 'label element type', type(labels_a[0]), 'label array type', type(labels_a)
images_a = np.array(images)

print 'images_a shape before', images_a.shape
#images_a = tf.contrib.layers.flatten(images_a)
#images_a = images_a.flatten()
print 'images_a flattened shape', images_a.shape
print 'post flatten image_a type', type(images_a)

testImages = []
print('loading %d test image(s)' % len(testData))
for file in testData:
  print('  loading %s:' % file)
  img = skimage.data.imread(join(IMAGEDIR, thumbFile(file)))
  #testImages.append(img)
  testImages.append(np.array(img).flatten())

testImages_a = np.array(testImages)
#testImages_a = tf.contrib.layers.flatten(testImages_a)
#testImages_a = testImages_a.flatten()

print 'labels:', labels_a.shape, 'images:', images_a.shape, 'test-images:', testImages_a.shape

#print labels_a

def main(_):

  # Create the model
  x = tf.placeholder(tf.float32, [None, 80 * 60 * 3])
  W = tf.Variable(tf.zeros([80 * 60 * 3, 3]))
  b = tf.Variable(tf.zeros([3]))
  y = tf.matmul(x, W) + b

  # Define loss and optimizer
  y_ = tf.placeholder(tf.float32, [None, 3])

  # The raw formulation of cross-entropy,
  #
  #   tf.reduce_mean(-tf.reduce_sum(y_ * tf.log(tf.nn.softmax(y)),
  #                                 reduction_indices=[1]))
  #
  # can be numerically unstable.
  #
  # So here we use tf.nn.softmax_cross_entropy_with_logits on the raw
  # outputs of 'y', and then average across the batch.
  cross_entropy = tf.reduce_mean(
      tf.nn.softmax_cross_entropy_with_logits(labels=y_, logits=y))
  train_step = tf.train.GradientDescentOptimizer(0.5).minimize(cross_entropy)
  #train_step = tf.train.AdamOptimizer(learning_rate=0.001).minimize(cross_entropy)

  trained_images = np.array_split(images_a, 2)[1]
  trained_labels = np.array_split(labels_a, 2)[1]

  trained_images = images_a
  trained_labels = labels_a
  #test_images = np.array_split(images_a, 2)[0]
  #test_labels = np.array_split(labels_a, 2)[0]
  sess = tf.InteractiveSession()
  tf.global_variables_initializer().run()
  
  # Train
  for i in range(500):
    ret = sess.run(train_step, feed_dict={x: trained_images, y_: trained_labels})
    if i % 20 == 0:
      print 'loss on', i, 'is', ret

  # make some predictions on the test data
  prediction = tf.argmax(y, 1)
  #probabilities = y
  #probabilities = y/tf.reduce_sum(y,0)
  probabilities = y/tf.reduce_sum(y,0)

  print ' ======= TEST DATA SET ========= '
  predicts = prediction.eval(feed_dict={x: testImages_a}, session=sess)
  probs = probabilities.eval(feed_dict={x: testImages_a}, session=sess)
  #probs = y.eval(feed_dict={x: testImages_a}, session=sess)
  print 'made predictions, type=', type(predicts), 'data:', predicts
  for i in range(len(testData)):
    pbs = probs[i]
    #print('%s  color=%s G=%.3f W=%.3f B=%.3f' % (testData[i], n2c(predicts[i]), pbs[0], pbs[1], pbs[2]))

  outputs = y.eval(feed_dict={x: testImages_a}, session=sess)
  #print 'test set y outputs:\n', outputs, '\nshape:', outputs.shape
  for o in outputs:
    print('type: %s sum: %.3f' % (type(o), o.sum()))
    for p in o:
      sys.stdout.write('%.3f | ' % p)
    sys.stdout.write('\n')
    sys.stdout.flush()
  
  outputHtml('unclassified.html', testData, [ n2c(p) for p in predicts ], [ 'unknown' for i in range(len(testData)) ] , probs)

  print ' ======= ACTUAL DATA SET ========= '
  predicts = prediction.eval(feed_dict={x: images_a}, session=sess)
  #print 'made predictions, type=', type(predicts), 'data:', predicts
  for i in range(len(trainedData)):
    predictColor = n2c(predicts[i])
    actualColor = trainedData[i][1]
    verdict = 'WRONG'
    if predictColor == actualColor:
      verdict = 'CORRECT'
    #print('%s: %s predicted: %s actual: %s' % (trainedData[i], verdict, predictColor, actualColor))

  outputHtml('classified.html', [ i[0] for i in trainedData ], [ n2c(p) for p in predicts ], [ c[1] for c in trainedData ] )
  
  # Test trained model
  correct_prediction = tf.equal(tf.argmax(y, 1), tf.argmax(y_, 1))
  accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))
  print(sess.run(accuracy, feed_dict={x: images_a,
                                      y_: labels_a}))
  
  
  #probs = probabilities.eval(feed_dict={x: images_a}, session=sess)
  #print 'ACTUAL probabilities: ', type(probs), probs
  

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('--data_dir', type=str, default='/tmp/tensorflow/mnist/input_data',
                      help='Directory for storing input data')
  FLAGS, unparsed = parser.parse_known_args()
  tf.app.run(main=main, argv=[sys.argv[0]] + unparsed)
