#!/usr/bin/env python

import cv2
import numpy as np
from matplotlib import pyplot as plt

if len(sys.argv) != 2:
  sys.stderr.write('usage: %s <image>\n')
  sys.exit(1)
  
img = cv2.imread(sys.argv[1])
