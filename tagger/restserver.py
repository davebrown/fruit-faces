import falcon
from falcon_multipart.middleware import MultipartMiddleware
import json
import sys
import threading
import os
import tempfile
import traceback
import logging
from gunicorn.errors import HaltServer
from gunicorn.app.base import BaseApplication
#from wsgiref import simple_server


#import faulthandler, signal
#faulthandler.register(signal.SIGUSR1)
#print '\n\n\nfaulthandler enabled?', faulthandler.is_enabled(), '\n\n\n'

import numpy as np
from keras.models import load_model
from keras import backend as K
import tensorflow as tf

logger = logging.getLogger('tagservice')

def say(*args):
  name = threading.currentThread().name
  if name is None:
    name = '_no-thread-name_'
  suffix = ' '.join([str(e) for e in args])
  logger.info('<%d-%s> %s' % (os.getpid(), name, suffix))
  

# Import helper functions
try:
  say('restserver executing!!! put %s in lib path' % os.path.dirname(__file__))
  dir_path = os.path.dirname(os.path.realpath(__file__))
  sys.path.insert(0, dir_path)
  from tag_util import n2c, decodeSize
  from imread import imread
except:
  logger.exception('EXCEPTION importing ML')
  traceback.print_exc()
  sys.exit(1)

say('all imports ok')

K.set_learning_phase(0) # all new operations will be in test mode from now on

SESSION = None

def loadModel():
  # look first for a .h5 file in argv,
  # then look for FF_MODEL in environment
  # then fail
  model = None
  global SESSION
  #SESSION = tf.Session(graph=GRAPH)
  SESSION = tf.Session()
  K.set_session(SESSION)
  say('default session, PRE - with %s' % str(tf.get_default_session()))
  with SESSION.as_default():
    say('default session, POST - with %s' % str(tf.get_default_session()))
    for f in sys.argv[1:]:
      if '.h5' in f:
        logger.info('loading keras model from %s' % f)
        model = load_model(f)
    if model is None and os.environ.get('FF_MODEL', None) is not None:
      logger.info('loading keras model from %s' % os.environ['FF_MODEL'])
      model = load_model(os.environ['FF_MODEL'])
    else:
      msg = 'cannot find model file in sys.argv or in environment var "FF_MODEL"'
      logger.error(msg)
      raise HaltServer(msg)

  # necessary for multi-threads, for some reason
  model._make_predict_function()
  #GRAPH.finalize() # avoid modifications
  return model
    
class InfoResource:

  def on_get(self, req, resp):
    body = {
      'resources': [ { 'name': 'model', 'status': 'OK' } ]
    }

    resp.body = json.dumps(body)

class PrivateResource:

  def __init__(self, code=401, msg = "go away"):
    self.code = code
    self.msg = msg

  def on_get(self, req, resp):
    raise falcon.HTTPError(self.code, self.msg, 'other message')

class TagResource:

  def __init__(self):
    self.model = None
    self.width, self.height = decodeSize(os.environ.get('FF_MODEL_SIZE', '28x28'))
    say('got model width', self.width, 'height', self.height)
    # do late, lazy loading of the keras model. It fails (hangs) in the child process of the gunicorn
    # worker if we load it in the parent process. After ~2 days debugging, lazy load is the best way
    # to make progress :-/
    #self.model = loadModel()
    #with SESSION.as_default():
    #  self._initModel()
      
  # def _initModel(self):
  #   say('validating model')
  #   try:
  #     data = np.array([ skimage.data.imread('/Users/dave/code/fruit-faces/thumbs/IMG_4036_28x28_t.jpg') ] )
  #     if os.environ.get('FLATTEN', None) is not None:
  #       data = np.array(data).flatten()
  #     say('initModel() loaded validation data, shape %s' % str(data.shape))
  #     predicts = self.model.predict(data)
  #     say('validation prediction: %s' % str(n2c(predicts[0])))
  #     self.model.summary()
  #   except:
  #     msg = 'EXCEPTION in validating model'
  #     print(msg)
  #     traceback.print_exc()
  #     err(msg)
  #     raise HaltServer(msg)

  def on_post(self, req, resp, **kwargs):
    image = req.get_param('imagefile')
    raw = image.file.read()
    filename = image.filename
    say('read file:', filename, 'len:', len(raw))

    tmpfile = tempfile.mktemp()
    say('writing to file %s' % tmpfile)
    with open(tmpfile, 'wb') as tmp:
      tmp.write(raw)
      tmp.close()
      #data = np.array([ skimage.data.imread(tmpfile) ])
      data = np.array([ imread(tmpfile) ])
      say('upload numpy shape: %s' % str(data.shape))
      os.remove(tmpfile)

    if self.model is None:
      say('on_get, loading model')
      self.model = loadModel()
      say('on_get, loaded model')

    # verify the shape of the data
    # FIXME: this assumes unflattened data for 'mnist' model from ml-keras-plates.py
    # If it ever tries to run on flattened data, the below will need to be smarter
    if len(data.shape) != 4 or self.width != data.shape[1] or self.height != data.shape[2] or data.shape[3] != 3:
      logger.debug('data dimensions', len(data.shape), data.shape[1], data.shape[2], data.shape[3])
      msg = 'expect %dx%d image size, got shape %s' % (self.width, self.height, str(data.shape))
      logger.error('tag resource post:', msg)
      raise falcon.HTTPError(falcon.HTTP_400, msg)
    
    try:
      #faulthandler.dump_traceback_later(4, repeat=True)
      predicts = self.model.predict(data)
    except:
      print('EXCEPTION in predicts')
      traceback.print_exc()
      raise falcon.HTTPError(falcon.HTTP_500, 'internal error')
    
    say('ran predictions')

    body = {
      'tags': [ n2c(predicts[0]) ]
    }
    resp.body = json.dumps(body)    
    
  
  
app = falcon.API(middleware=[MultipartMiddleware()])
PREFIX = '/api/v1'
app.add_route(PREFIX + '/ping', InfoResource())
app.add_route(PREFIX + '/400', PrivateResource(falcon.HTTP_400, 'bad request'))
app.add_route(PREFIX + '/401', PrivateResource(falcon.HTTP_401, 'authentication required'))
app.add_route(PREFIX + '/tags', TagResource())

class GunicornApp(BaseApplication):
    """ Custom Gunicorn application
    This allows for us to load gunicorn settings from an external source
    """
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super(GunicornApp, self).__init__()

    def load_config(self):
        for key, value in self.options.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application


def main():
  gconf = {
    'bind': '0.0.0.0:5000',
    'workers': 1,
    'enable_stdio_inheritance': True
  };
  gunicorn_app = GunicornApp(app, gconf)
  gunicorn_app.run()
  
      
if __name__ == '__main__':
 # can't do file upload :-(
 # httpd = simple_server.make_server('0.0.0.0', 5000, app)
 # httpd.serve_forever()
  try:
    main()
  except:
    logger.exception('EXCEPTION in main')
    traceback.print_exc()
    
  
