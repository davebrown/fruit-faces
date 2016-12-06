import { EventEmitter } from 'events';
import { IMAGE_CHANGED, IMAGES_LOADED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';

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
}

const imageStore = new ImageStore();

var images = null;
var selectedImage = null;

const CHANGE_EVENT = 'change';

Dispatcher.register((action) => {
  console.log('ImageStore dispatcher callback ' + action.actionType);
  switch (action.actionType) {
    case IMAGE_CHANGED:
    selectedImage = action.image;
    imageStore.emitChange();
    break;
    case IMAGES_LOADED:
    images = action.images;
    imageStore.emitChange();
    break;
  }
});

export default imageStore;

