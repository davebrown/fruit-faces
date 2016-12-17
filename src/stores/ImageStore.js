import { EventEmitter } from 'events';
import { IMAGE_CHANGED, IMAGES_LOADED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
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

  getImage(base) {
    return imageMap && imageMap[base];
  }

  getSelectedImage() {
    return selectedImage;
  }

  getImages() {
    return images;
  }

  // just a re-ordering from the UI logic
  // no event fired here
  /*setOrderedList(oList) {
    indexImages(oList);
    images = oList;
  }*/

  getNextImage() {
    var ret = selectedImage ? images[(selectedImage.index + 1) % images.length]: null;
    console.log('selected, next index=' + selectedImage.index + '/' + ret.index);
    return ret;
  }

  getPreviousImage() {
    return selectedImage ? images[Math.max(selectedImage.index - 1, 0)]: null;
  }

  getTaggedImages(tag) {
    return images.filter((img) => { return imageHasTag(img, tag); });
  }

  getBlues() {
    return getTaggedImages('blue');
  }

  getWhites() {
    return getTaggedImages('white');
  }

  getGrays() {
    return getTaggedImages('gray');
  }

  getNonColors() {
    return images.filter((img) => { return !imageHasTag(img, 'blue'); });
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
    image.index = i;
    imageMap[image.base] = image;
  }
  console.log('images indexed');
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
const HEART_21 = '000000000000000000000000111100000001111000011111110000011111110111111111101111111111011111111111111111110000111111111111111000000001111111111100000000000011111110000000000000000111000000000000000000010000000000000000000000000000000'

function imageList(map, blues, grays) {
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
  return ret;
}

Dispatcher.register((action) => {
  //console.log('ImageStore dispatcher callback ' + action.actionType);
  switch (action.actionType) {
    case IMAGE_CHANGED:
    selectedImage = action.image;
    imageStore.emitChange();
    break;
    case IMAGES_LOADED:
    images = action.images;
    var blues = imageStore.getBlues();
    var grays = imageStore.getNonBlues();
    images = imageList(HEART_21, blues, grays);
    //indexImages(images);
    imageStore.emitChange();
    break;
  }
});

export default imageStore;

