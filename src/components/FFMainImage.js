import React from 'react';
import { hashHistory } from 'react-router';
import ImageStore from '../stores/ImageStore.js';
import { IMAGE_CHANGED, IMAGES_LOADED, IMAGE_DELETED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import FFActions from '../actions/FFActions.js';
import TagForm from './TagForm.js';
import dateformat from 'dateformat';
import Swipable from 'react-swipeable';
import FBBlock from './FBBlock.jsx';

//var fbUpdated = false;

class FFMainImage extends React.Component {

  constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    this.log('CTOR');
    this.mounted = false;
    this.mainImageActionListener = this.mainImageActionListener.bind(this);
    this.swipeLeft = this.swipeLeft.bind(this);
    this.swipeRight = this.swipeRight.bind(this);
    this.onSwiping = this.onSwiping.bind(this);
    this.onSwipingLeft = this.onSwipingLeft.bind(this);
    this.onSwipingRight = this.onSwipingRight.bind(this);
    //this.log = this.log.bind(this);
  }

  mainImageActionListener(action) {
    //console.log('FFMainImage.action: ' + action.actionType);
    switch (action.actionType) {
      case IMAGES_LOADED:
        // FIXME: necessary for when we arrive with an image route selected,
        // but the images are not loaded yet...
        this.forceUpdate();
        break;
      case IMAGE_CHANGED:
        //console.log('FFMainImage action ' + action.actionType + ' to', action.image, ' mounted?' + this.mounted);
        if (this.mounted) {
          this.setState( { image: action.image } );
          this.props = { }; // clear out router state
        }
        break;
      case IMAGE_DELETED:
        //console.log('FFMainImage action ' + action.actionType + ' from ', action.image, ' to ', action.newImage, ' mounted?' + this.mounted);
        if (this.mounted) {
          this.setState( { image: action.newImage } );
          this.props = { }; // clear out router state
        }
        break;
    }
  }

  componentWillMount() {
    this.log('willMount');
    this.dispatcherToken = Dispatcher.register(this.mainImageActionListener);
    this.log('dispatcherToken', '"' + this.dispatcherToken + '"');
    this.setState( { image: ImageStore.getSelectedImage() } );
  }

  componentDidMount() {
    this.log('didMount');
    this.mounted = true;
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.log('willReceiveProps');
  }

  /*
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    this.log('shouldUpdate');
    console.debug(this.props);
    console.debug(nextProps);
    //var ret = super.shouldComponentUpdate(nextProps, nextState, nextContext);
    var ret = true;
    this.log('shouldUpdate->' + ret);
    return ret;
  }
  */

  componentWillUpdate(nextProps, nextState, nextContext) {
    this.log('willUpdate');
  }

  componentDidUpdate(nextProps, nextState, nextContext) {
    this.log('didUpdate');
  }

  componentWillUnmount() {
    this.log('willUnmount');
    this.mounted = false;
    var tmpToken = this.dispatcherToken;
    this.dispatcherToken = null;
    if (tmpToken) {
      this.log('unregistering token "' + tmpToken + '"');
      Dispatcher.unregister(tmpToken);
    }
  }
  
  render() {
    var image = this.state.image;
    if (!image) {
      // if image to render is not set in the state, we can also receive it from
      // the router as a property
      var imageId = this.props && this.props.params && this.props.params.imageId;
      this.log('render: imageId=' + imageId);
      image = ImageStore.getImage(imageId);
      if (!image) {
        this.log('no image or not found, returning null');
        hashHistory.replace('/');
        return (<div>no image</div>);
      }
    }
    var src = '/thumbs/' + image.full;
    var tagForm = <TagForm className="tag-form" image={image}/>;
    //tagForm = ''; // not in prod yet
    // FIXME: should a component be doing this?
    window.location.hash = '/images/' + image.base;
    var dateStr = 'Unknown date...';
    var timeStr = '';
    if (image.timestamp) {
      dateStr = dateformat(new Date(image.timestamp), 'dddd mmmm d, yyyy');
      timeStr = dateformat(new Date(image.timestamp), 'h:MM TT');
    }
    var key = 'main-image-' + image.base;
    return (
      <Swipable id={key} key={key} onSwipedLeft={this.swipeLeft} onSwipedRight={this.swipeRight}
        onSwipingLeft={this.onSwipingLeft} onSwipingRight={this.onSwipingRight}
        onSwiping={this.onSwiping}>
        {tagForm}
        <div id="main-image-holder" onTouchStart={this.onTouchStart} onTouchEnd={this.onTouchEnd}>
          <img id="main-image" src={src}/>
          <p className="sans-font">
            {timeStr}<br/>
            {dateStr}
          </p>
          <FBBlock like={true}/>
        </div>
      </Swipable>
    );
  }
  
  onSwipingLeft(event, absX) {
    //console.log('onSwipingLeft(' + absX + ')');
    this.translateImage(-absX);
  }
  onSwipingRight(event, absX) {
    //console.log('onSwipingRight(' + absX + ')');
    this.translateImage(absX);
  }

  onTouchStart(event) {
    //console.log('onTouchStart', event);
  }

  onTouchEnd(event) {
    //console.log('onTouchEnd', event);
  }

  translateImage(delta) {
    var imageHolder = document.getElementById('main-image-holder');
    if (imageHolder != null) {
      imageHolder.style.left = delta + 'px';
    } else {
      //console.log('CANNOT FIND IMAGE HOLDER');
    }
  }
  onSwiping(event, deltaX, deltaY, absX, absY, velocity) {
    //console.log('onSwiping(' + deltaX + ', ' + deltaY + ', ' + absX + ', ' + absY + ', ' + velocity + ')');
  }
  
  swipeLeft() {
    var newImage = ImageStore.getPreviousImage();
    this.pushImage(newImage);
  }

  swipeRight() {
    var newImage = ImageStore.getNextImage();
    this.pushImage(newImage);
  }

  pushImage(newImage) {
    FFActions.imageChanged(newImage);
    hashHistory.replace(newImage ? '/images/' + newImage.base : '/');
  }
  
  log(msg) {
    //console.debug('FFMainImage: ' + msg + ' | mounted=' + this.mounted);
  }
}

export default FFMainImage;
