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

  getSelectedImage() {
    return selectedImage;
  }

  getImages() {
    return images;
  }

  getNextImage() {
    return selectedImage ? images[(selectedImage.index + 1) % images.length]: null;
  }

  getPreviousImage() {
    return selectedImage ? images[Math.max(selectedImage.index - 1, 0)]: null;
  }

  getBlues() {
    return images.filter((img) => { return imageHasTag(img, 'blue'); });
  }

  getNonBlues() {
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
  for (var i = 0; i < images.length; i++) {
    images[i].index = i;
  }
}

var images = null;
var selectedImage = null;

const CHANGE_EVENT = 'change';

Dispatcher.register((action) => {
  //console.log('ImageStore dispatcher callback ' + action.actionType);
  switch (action.actionType) {
    case IMAGE_CHANGED:
    selectedImage = action.image;
    imageStore.emitChange();
    break;
    case IMAGES_LOADED:
    images = action.images;
    indexImages(images);
    imageStore.emitChange();
    break;
  }
});

export default imageStore;

