#!/bin/bash

#DIM=60x80
DIM=28x28
./ml-keras-plates.py -m mnist -e 600 train -s $DIM -v -f /tmp/model-${DIM}.h5
