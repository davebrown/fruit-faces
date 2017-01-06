import Dispatcher from '../dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED, ORIENTATION_CHANGED } from '../constants/FFConstants.js';
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

  orientationChanged() {
    Dispatcher.dispatch({
      actionType: ORIENTATION_CHANGED
    });
  }
}

export default new FFActions();
  
