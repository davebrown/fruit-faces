#!/bin/bash

set -e

export FF_MODEL=model_plates-28x28.h5
gunicorn -b 0.0.0.0:5000 tagservice:app -R --reload
