import Dispatcher from '../dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGE_ADDED, IMAGE_DELETED, IMAGES_LOADED, ORIENTATION_CHANGED, FILTER_CHANGED, KEY_NAV_HAPPENED, FB_INITIALIZED, FB_AUTH_CHANGED } from '../constants/FFConstants.js';
//import { * } from '../constants/FFConstants.js'; can't do this :-/

class FFActions {

  imagesLoaded(images) {
    Dispatcher.dispatch({
      actionType: IMAGES_LOADED,
      images: images
    });
  }
  
  imageChanged(image) {
    Dispatcher.dispatch({
      actionType: IMAGE_CHANGED,
      image: image
    });
  }

  imageAdded(image) {
    Dispatcher.dispatch({
      actionType: IMAGE_ADDED,
      image: image
    });
  }

  imageDeleted(deadImage, newImage) {
    Dispatcher.dispatch({
      actionType: IMAGE_DELETED,
      image: deadImage,
      newImage: newImage
    });
  }
  
  orientationChanged() {
    Dispatcher.dispatch({
      actionType: ORIENTATION_CHANGED
    });
  }

  filterChanged(filter) {
    Dispatcher.dispatch({
      actionType: FILTER_CHANGED,
      filter: filter
    });
  }

  keyNavHappened(keyCode) {
    Dispatcher.dispatch({
      actionType: KEY_NAV_HAPPENED,
      keyCode: keyCode
    });
  }

  fbInitialized() {
    Dispatcher.dispatch({
      actionType: FB_INITIALIZED
    });
  }

  fbAuthChanged() {
    Dispatcher.dispatch({
      actionType: FB_AUTH_CHANGED
    });
  }
}

export default new FFActions();
  
