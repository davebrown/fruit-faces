import { EventEmitter } from 'events';
import { IMAGE_CHANGED, IMAGES_LOADED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import bowser from 'bowser';

//import _ from  'loadash';

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

  getImages() {
    return images;
  }

  getNextImage() {
    var ret = selectedImage ? images[(selectedImage.index + 1) % images.length]: null;
    //console.log('selected, next index=' + selectedImage.index + '/' + (ret && ret.index));
    return ret;
  }

  getPreviousImage() {
    var ret = selectedImage ? images[Math.max(selectedImage.index - 1, 0)]: null;
    //console.log('selected, prev index=' + selectedImage.index + '/' + (ret && ret.index));
    return ret;
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
    //image.index = i;
    imageMap[image.base] = image;
  }
  console.log('images indexed (count=' + images.length + ')');
}
// array
var images = null;
// key->object map
var imageMap = null;
var selectedImage = null;

const CHANGE_EVENT = 'change';

const MOBILE_HEART_9 = '000000000011101110111111111011111110001111100000111000000010000000000000';
const MOBILE_HEART_10 = '00000000000111011100111111111001111111000011111000000111000000001000000000000000';
const MOBILE_HEART_11 = '0000000000000111011100011111111100011111110000011111000000011100000000010000000000000000';
const MOBILE_HEART_12 = '000000000000000111011100001111111110000111111100000011111000000001110000000000100000';
const HEART_16 = '0000000000000000001110000011100011111110111111101111111111111110011111111111110000011111111100000000011111000000000000111000000000000001000000000000000000000000'
const HEART_21 = '000000000000000000000000111100000001111000011111110000011111110111111111101111111111011111111111111111110000111111111111111000000001111111111100000000000011111110000000000000000111000000000000000000010000000000000000000000000000000'

function mix2(arrays) {
  var total = 0;
  var i, j;
  for (i = 0; i < arrays.length; i++) {
    total += arrays[i].length;
  }
  var ret = [];
  for (i = 0; i < arrays.length; i++) {
    for (j = 0; j < arrays[i].length; j++) {
      var img = arrays[i][j];
      img.index = ret.length;
      ret.push(img);
    }
  }
  return ret;
}

function mix(arrays) {
  var ret = [];
  var i, j;
  for (i = 0; i < arrays.length; i++) {
    for (j = 0; j < arrays[i].length; j++) {
      var img = arrays[i][j];
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
  //return mix2([whites, blues, grays, nons]);
  grays = mix2([whites, grays]);
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
    imageStore.emitChange();
    break;
    case IMAGES_LOADED:
    images = action.images;
    images = imageList(bowser.mobile ? MOBILE_HEART_12: HEART_16, images);
    indexImages(images);
    imageStore.emitChange();
    break;
  }
});

export default imageStore;

