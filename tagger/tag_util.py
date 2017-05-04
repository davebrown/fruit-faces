import numpy as np

__all__ = ['getTags', 'c2n', 'n2c', 'decodeSize' ]

# FIXME: madness ensues if the order of tags in getTags(), n2c(), c2n(), change
# Fix this with one DRY copy of tags and their indices
def getTags():
  ret = [ 'blue', 'gray', 'white' ]
  return ret

def c2n(c):
    if c == 'white': return 2
    if c == 'gray': return 1
    if c == 'blue': return 0
    raise ValueError('unknown color: "%s"' % c)

def n2c(n):
  if isinstance(n, (np.ndarray)):
    # assume a 1-hot output, with only one dimension on input
    if len(n.shape) > 1:
      raise ValueError('cannot n2c multi-dimension array, shape=%s' % str(n.shape))
    n = n.argmax()
  if n == 2: return 'white'
  if n == 1: return 'gray'
  if n == 0: return 'blue'
  raise ValueError('unknown color numeric: "%d"' % n)

def decodeSize(sz):
  """from '60x80' return (60, 80)"""
  try:
    w,h = sz.split('x', 2)
    w = int(w)
    h = int(h)
    return w, h
  except ValueError as ve:
    fail('invalid dimension "%s"' % sz)

