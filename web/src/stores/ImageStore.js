import { EventEmitter } from 'events';
import { IMAGE_CHANGED, IMAGE_ADDED, IMAGE_DELETED, IMAGES_LOADED, ORIENTATION_CHANGED, FILTER_CHANGED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { hashHistory } from '../util/Util.js';
import bowser from 'bowser';
import amplitude from 'amplitude-js/amplitude.min';

// STATE
// array
var images = null;
// key->object map
var imageMap = null;
var selectedImage = null;
var filterTag = null;

class ImageStore extends EventEmitter {

  emitChange() {
    this.emit(CHANGE_EVENT);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  haveImages() {
    return images && images.length > 0;
  }

  getImage(base) {
    return base && imageMap && imageMap[base];
  }

  getSelectedImage() {
    return selectedImage;
  }

  setSelectedImage(image) {
    selectedImage = image;
  }
  
  getImages() {
    return images;
  }

  getNextImage() {
    var ret = selectedImage ? images[(selectedImage.index + 1) % images.length]: null;
    //console.log('ImageStore.getNext() selected, next index=' + selectedImage.index + '/' + (ret && ret.index));
    return ret;
  }

  getPreviousImage() {
    var ret = selectedImage ? images[Math.max(selectedImage.index - 1, 0)]: null;
    //console.log('selected, prev index=' + selectedImage.index + '/' + (ret && ret.index));
    return ret;
  }

  // go up one row
  getAboveImage() {
    var ret = null;
    if (selectedImage) {
      var newIndex = selectedImage.index - mapWidth;
      if (newIndex < 0) {
        // wrap around, and go back (left) one column
        var newCol = selectedImage.index % mapWidth - 1;
        if (newCol < 0) newCol = mapWidth - 1;
        var lastRowLen = images.length % mapWidth;
        if (newCol < lastRowLen) {
          newIndex = images.length - (lastRowLen - newCol);
        } else {
          newIndex = images.length - lastRowLen - (mapWidth - newCol);
        }
      }
      ret = images[newIndex];
    }
    return ret;
  }

  getBelowImage() {
    var ret = null;
    if (selectedImage) {
      var newIndex = selectedImage.index + mapWidth;
      if (newIndex < images.length) {
        ret = images[newIndex];
      } else {
        // wrap around, and go forward (right) one column
        var newCol = selectedImage.index % mapWidth + 1;
        if (newCol === images.length) newCol = 0;
        newIndex = newCol;
        // guard the edge case where mapWidth < images.length
        ret = newIndex < images.length ? images[newCol] : null;
      }
    }
    return ret;
  }
  getFilterTag() {
    return filterTag;
  }
  
  getTaggedImages(tag) {
    return images.filter((img) => { return imageHasTag(img, tag); });
  }

  getBlues() {
    return this.getTaggedImages('blue');
  }

  getWhites() {
    return this.getTaggedImages('white');
  }

  getGrays() {
    return this.getTaggedImages('gray');
  }

  getNonColors() {
    return images.filter((img) => { return img.tags === null || img.tags.length === 0; });
  }
}

const imageStore = new ImageStore();

// FIXME: cut/paste
function imageHasTag(image, tag) {
  if (image) {
    if (!image.tags) image.tags = [];
    for (var i = 0, len = image.tags.length; i < len; i++) {
      if (tag === image.tags[i]) return true;
    }
  }
  return false;
}

function indexImages(images) {
  imageMap = {};
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    if (!image.path) {
      image.path = image.root + '/' + image.base;
    }
    //imageMap[image.base] = image;
    imageMap[image.path] = image;
    image.index = i;
  }
  console.log('images indexed (count=' + images.length + ')');
}

const CHANGE_EVENT = 'change';

const MOBILE_HEART_9 = '000000000011101110111111111011111110001111100000111000000010000000000000';
const MOBILE_HEART_10 = '00000000000111011100111111111001111111000011111000000111000000001000000000000000';
const MOBILE_HEART_11 = '0000000000000111011100011111111100011111110000011111000000011100000000010000000000000000';
const MOBILE_HEART_12 = '000000000000000111011100001111111110000111111100000011111000000001110000000000100000';
const HEART_16 = '0000000000000000001110000011100011111110111111101111111111111110011111111111110000011111111100000000011111000000000000111000000000000001000000000000000000000000'
const HEART_17 = '00000000000000000000111000001110000111111101111111001111111111111110001111111111111000000111111111000000000011111000000000000011100000000000000010000000000000000000000000';
const HEART_21 = '000000000000000000000000111100000001111000011111110000011111110111111111101111111111011111111111111111110000111111111111111000000001111111111100000000000011111110000000000000000111000000000000000000010000000000000000000000000000000'

const WIDTH_MAP = {
  9: MOBILE_HEART_9,
  10: MOBILE_HEART_10,
  11: MOBILE_HEART_11,
  12: MOBILE_HEART_12,
  16: HEART_16,
  17: HEART_17,
  21: HEART_21
}

// number of columns in the image map
var mapWidth = 16;
const DEFAULT_THUMB_MAP = HEART_16;


function getMobileMap() {
  var width = document.body.clientWidth;
  var ret = WIDTH_MAP[9];
  for (var key in WIDTH_MAP) {
    if (WIDTH_MAP.hasOwnProperty(key) && 30 * (key) <= width) {
      //console.debug('getMobileMap() for width=' + width + ', ' + key + '/' + (30*key) + ' is a match');
      ret = WIDTH_MAP[key];
      mapWidth = key;
    }
  }
  return ret;
}

function mix(arrays) {
  var i, j;
  var ret = [];
  var max = 0;
  for (i = 0; i < arrays.length; i++) {
    max = max < arrays[i].length ? arrays[i].length : max;
  }

  for (i = 0; i < max; i++) {
    for (j = 0; j < arrays.length; j++) {
      if (i >= arrays[j].length) continue;
      var img = arrays[j][i];
      img.index = ret.length;
      ret.push(img);
    }
  }
  return ret;
}


function imageList(map, images) {
  var blues = imageStore.getBlues();
  var whites = imageStore.getWhites();
  var grays = imageStore.getGrays();
  var nons = imageStore.getNonColors();
  grays = mix([whites, grays]);
  var ret = [];
  var i = 0;
  for (i = 0; blues.length > 0 && grays.length; i++) {
    var c = map[i % map.length];
    switch (c) {
    case '0':
      ret.push(grays.pop());
      break;
    case '1':
      ret.push(blues.pop());
      break;
    default:
      throw new Error('invalid map value: ' + c);
    }
    ret[i].index = i;
  }
  //console.log('end pattern loop, leftover blues=' + blues.length + " grays=" + grays.length);
  var leftover = blues.length > 0 ? blues: grays;
  while (leftover.length > 0) {
    ret.push(leftover.pop());
    ret[ret.length - 1].index = i++;
  }
  while (nons.length > 0) {
    ret.push(nons.pop());
    ret[ret.length - 1].index = i++;
  }
  return ret;
}

Dispatcher.register((action) => {
  switch (action.actionType) {
    case IMAGE_CHANGED:
      selectedImage = action.image;
      if (!selectedImage) {
        throw new Error('image changed to NULL');
      }
      imageStore.emitChange();
      var base = selectedImage ? selectedImage.base : null;
      if (base) {
        // undo filter selection if an image is selected
        filterTag = null;
        amplitude.logEvent('IMAGE_SELECTED', { imageBase: base, filter: imageStore.getFilterTag() || 'none' });
      }
      break;
    case IMAGE_ADDED:
      //console.log('imageStore adding image', action.image);
      if (!images) images = [];
      images = images.slice();
      images.push(action.image);
      imageMap[action.image.base] = action.image;
      indexImages(images);
      imageStore.emitChange();
      break;
    case IMAGE_DELETED:
      //console.log('imageStore deleting image');
      const del = action.image;
      delete imageMap[del.base];
      var ind = 0;
      while (ind < images.length) {
        if (images[ind].base === del.base) {
          break;
        }
        ind++;
      }
      if (ind < images.length) {
        images.splice(ind,1);
        images = images.slice();
      }
      indexImages(images);
      selectedImage = action.newImage;
      imageStore.emitChange();
      break;
    case IMAGES_LOADED:
      images = action.images;
      images = imageList(bowser.mobile ? getMobileMap(): DEFAULT_THUMB_MAP, images);
      indexImages(images);
      /* need to set selected image state, if any, from hash path
       * FIXME: cleaner way to do this?
       */
      var location = hashHistory.location;
      if (!imageStore.getSelectedImage() && location && location.pathname) {
        var elems = location.pathname.split('/');
        if (elems.length === 4 && elems[1] === 'images') {
          var selPath = '/' + elems[2] + '/' + elems[3];
          selectedImage = imageMap[selPath];
        }
      }
      imageStore.emitChange();
      break;
    case ORIENTATION_CHANGED:
      console.debug('emitting on orientation change');
      images = imageList(bowser.mobile ? getMobileMap(): DEFAULT_THUMB_MAP, images);
      imageStore.emitChange();
      break;
    case FILTER_CHANGED:
      //console.debug('changing filter ' + filterTag + ' => ' + action.filter);
      filterTag = action.filter;
      imageStore.emitChange();
      break;
  }
});

export default imageStore;

