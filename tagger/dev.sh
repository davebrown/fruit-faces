#!/bin/bash

set -e

export FF_MODEL=model_mnist-28x28.h5
gunicorn -b 0.0.0.0:5000 restserver:app -R --reload
