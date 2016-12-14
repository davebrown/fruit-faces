import Dispatcher from '../dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED } from '../constants/FFConstants.js';
//import { * } from '../constants/FFConstants.js'; can't do this :-/

class FFActions {

  imagesLoaded(images) {
    Dispatcher.dispatch({
      actionType: IMAGES_LOADED,
      images: images
    });
  }
  
  imageChanged(image) {
    //console.log('Action.imageChanged(' + image  + ')');
    Dispatcher.dispatch({
      actionType: IMAGE_CHANGED,
      image: image
    });
  }
}

export default new FFActions();
  
