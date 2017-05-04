# cribbed from https://github.com/scikit-image/scikit-image/blob/master/skimage/io/_plugins/pil_plugin.py
# in order to sever a whole lot of dependencies
__all__ = ['imread']

import numpy as np
from six import string_types
from PIL import Image

def imread(fname, dtype=None, img_num=None, **kwargs):
    """Load an image from file.

    Parameters
    ----------
    fname : str or file
       File name or file-like-object.
    dtype : numpy dtype object or string specifier
       Specifies data type of array elements.
    img_num : int, optional
       Specifies which image to read in a file with multiple images
       (zero-indexed).
    kwargs : keyword pairs, optional
        Addition keyword arguments to pass through.

    Notes
    -----
    Files are read using the Python Imaging Libary.
    See PIL docs [1]_ for a list of supported formats.

    References
    ----------
    .. [1] http://pillow.readthedocs.org/en/latest/handbook/image-file-formats.html
    """
    if isinstance(fname, string_types):
        with open(fname, 'rb') as f:
            im = Image.open(f)
            return pil_to_ndarray(im, dtype=dtype, img_num=img_num)
    else:
        im = Image.open(fname)
        return pil_to_ndarray(im, dtype=dtype, img_num=img_num)


def pil_to_ndarray(im, dtype=None, img_num=None):
    """Import a PIL Image object to an ndarray, in memory.

    Parameters
    ----------
    Refer to ``imread``.

    """
    try:
        # this will raise an IOError if the file is not readable
        im.getdata()[0]
    except IOError as e:
        site = "http://pillow.readthedocs.org/en/latest/installation.html#external-libraries"
        pillow_error_message = str(e)
        error_message = ('Could not load "%s" \n'
                         'Reason: "%s"\n'
                         'Please see documentation at: %s'
                         % (im.filename, pillow_error_message, site))
        raise ValueError(error_message)
    frames = []
    grayscale = None
    i = 0
    while 1:
        try:
            im.seek(i)
        except EOFError:
            break

        frame = im

        if img_num is not None and img_num != i:
            im.getdata()[0]
            i += 1
            continue

        if im.format == 'PNG' and im.mode == 'I' and dtype is None:
            dtype = 'uint16'

        if im.mode == 'P':
            if grayscale is None:
                grayscale = _palette_is_grayscale(im)

            if grayscale:
                frame = im.convert('L')
            else:
                if im.format == 'PNG' and 'transparency' in im.info:
                    frame = im.convert('RGBA')
                else:
                    frame = im.convert('RGB')

        elif im.mode == '1':
            frame = im.convert('L')

        elif 'A' in im.mode:
            frame = im.convert('RGBA')

        elif im.mode == 'CMYK':
            frame = im.convert('RGB')

        if im.mode.startswith('I;16'):
            shape = im.size
            dtype = '>u2' if im.mode.endswith('B') else '<u2'
            if 'S' in im.mode:
                dtype = dtype.replace('u', 'i')
            frame = np.fromstring(frame.tobytes(), dtype)
            frame.shape = shape[::-1]

        else:
            frame = np.array(frame, dtype=dtype)

        frames.append(frame)
        i += 1

        if img_num is not None:
            break

    if hasattr(im, 'fp') and im.fp:
        im.fp.close()

    if img_num is None and len(frames) > 1:
        return np.array(frames)
    elif frames:
        return frames[0]
    elif img_num:
        raise IndexError('Could not find image  #%s' % img_num)

def _palette_is_grayscale(pil_image):
    """Return True if PIL image in palette mode is grayscale.

    Parameters
    ----------
    pil_image : PIL image
        PIL Image that is in Palette mode.

    Returns
    -------
    is_grayscale : bool
        True if all colors in image palette are gray.
    """
    assert pil_image.mode == 'P'
    # get palette as an array with R, G, B columns
    palette = np.asarray(pil_image.getpalette()).reshape((256, 3))
    # Not all palette colors are used; unused colors have junk values.
    start, stop = pil_image.getextrema()
    valid_palette = palette[start:stop]
    # Image is grayscale if channel differences (R - G and G - B)
    # are all zero.
    return np.allclose(np.diff(valid_palette), 0)
      
