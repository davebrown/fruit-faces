#!/usr/bin/env python

import cv2
import numpy as np
from matplotlib import pyplot as plt
import os

img = cv2.imread(os.environ['HOME'] + '/pics/IMG_4534.JPG',0)
# minVal,maxVal
# thresholds of intensity gradient
edges = cv2.Canny(img,100,200)
print 'edges', edges

plt.subplot(121),plt.imshow(img,cmap = 'gray')
plt.title('Original Image'), plt.xticks([]), plt.yticks([])
plt.subplot(122),plt.imshow(edges,cmap = 'gray')
plt.title('Edge Image'), plt.xticks([]), plt.yticks([])

plt.show()
