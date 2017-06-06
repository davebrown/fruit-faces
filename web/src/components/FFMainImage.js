import React from 'react';
import dateformat from 'dateformat';
import Swipable from 'react-swipeable';
import { Icon } from 'react-fa';
import request from 'browser-request';

import { amplitude, API_BASE_URL, hashHistory, reportError, reportInfo } from '../util/Util.js';
import FBBlock from './FBBlock.jsx';
import ImageStore from '../stores/ImageStore.js';
import { IMAGE_CHANGED, IMAGES_LOADED, IMAGE_DELETED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import FFActions from '../actions/FFActions.js';
import TagForm from './TagForm.js';

const TAG_FORM_NONE = 0;
const TAG_FORM_ON = 1;
const TAG_FORM_OFF = 2;

class FFMainImage extends React.Component {

  constructor(props) {
    super(props);
    this.mounted = false;
    this.mainImageActionListener = this.mainImageActionListener.bind(this);
    this.swipeLeft = this.swipeLeft.bind(this);
    this.swipeRight = this.swipeRight.bind(this);
    this.onSwiping = this.onSwiping.bind(this);
    this.onSwipingLeft = this.onSwipingLeft.bind(this);
    this.onSwipingRight = this.onSwipingRight.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onTagClick = this.onTagClick.bind(this);
    this.onFBClick = this.onFBClick.bind(this);
    this.onUploadClick = this.onUploadClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    //this.log = this.log.bind(this);
  }

  mainImageActionListener(action) {
    // hack?
    //console.log('FFMainImage.action: ' + action.actionType + ' dispatching? ' + this.dispatching);
    switch (action.actionType) {
      case IMAGES_LOADED:
        // FIXME: necessary for when we arrive with an image route selected,
        // but the images are not loaded yet...
        this.forceUpdate();
        break;
      case IMAGE_CHANGED:
        //console.log('FFMainImage action ' + action.actionType + ' to', action.image, ' mounted?' + this.mounted);
        if (this.mounted) {
          this.setState( { image: action.image, animateTools: false } );
          this.props = { }; // clear out router state
        }
        break;
      case IMAGE_DELETED:
        //console.log('FFMainImage action ' + action.actionType + ' from ', action.image, ' to ', action.newImage, ' mounted?' + this.mounted);
        if (this.mounted) {
          this.setState( { image: action.newImage, animateTools: false } );
          this.props = { }; // clear out router state
          hashHistory.replace(action.newImage ? '/images' + action.newImage.path : '/');

        }
        break;
    }
  }

  componentWillMount() {
    this.log('willMount');
    this.dispatcherToken = Dispatcher.register(this.mainImageActionListener);
    this.log('dispatcherToken', '"' + this.dispatcherToken + '"');
    this.setState( {
      image: ImageStore.getSelectedImage(),
      tagState: TAG_FORM_NONE,
      animateTools: true
    }
    );
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
    const tagState = this.state.tagState;
    const animateTools = this.state.animateTools;
    const { userId, imageBase } = this.props.match.params;
    const imageId = '/' + userId + '/' + imageBase;
    var stateId = this.state.image && this.state.image.path || 'state_is_null';
    //console.log('FFMain.render imageId=' + imageId + ' stateId=' + stateId);
    // when we have both image from state and imageId from props, we prefer props
    // since this occurs when user manually changes the hash line in address bar
    if (!image) {
      // if image to render is not set in the state, we can also receive it from
      // the router as a property
      image = ImageStore.getImage(imageId);
      if (!image) {
        this.log('no image or not found, returning loading div');
        return (<div className="loading">loading image</div>);
      }
      //FFActions.imageChanged(image);
      ImageStore.setSelectedImage(image);
    }

    if (!image) {
      return (<div className="loading">whoops no image, wanted {imageId}</div>);
    }
    var src = '/thumbs' + image.root + '/' + image.full;
    var tagForm = '';
    if (tagState != TAG_FORM_NONE) {
      var tagClass = '';
      if (animateTools) {
        tagClass = (tagState == TAG_FORM_ON) ? 'animated fadeInRight' : 'animated fadeOutRight';
      }
      tagForm = (<TagForm className={tagClass} image={image}/>);
    }
    var dateStr = 'Unknown date...';
    var timeStr = '';
    if (image.timestamp) {
      dateStr = dateformat(new Date(image.timestamp), 'dddd mmmm d, yyyy');
      timeStr = dateformat(new Date(image.timestamp), 'h:MM TT');
    }
    const key = 'main-image-' + image.base;
    const userLink = 'https://facebook.com/' + image.user.fbId;
    const fbClass = this.state.animateFB ? 'animated shake' : '';
    return (
      <Swipable id={key} key={key} onSwipedLeft={this.swipeLeft} onSwipedRight={this.swipeRight}
        onSwipingLeft={this.onSwipingLeft} onSwipingRight={this.onSwipingRight}
        onSwiping={this.onSwiping}>
        <div id="main-image-holder" className="flex-container" onTouchStart={this.onTouchStart} onTouchEnd={this.onTouchEnd}>
          <img id="main-image" src={src} onMouseEnter={this.onMouseEnter} onMouseOut={this.onMouseOut}/>
          <ImageToolbar onFBClick={this.onFBClick} onTagClick={this.onTagClick}
            onUploadClick={this.onUploadClick} onDeleteClick={this.onDeleteClick}
          />
          { tagForm }
        </div>
        <div>
          <p className="sans-font">
            {timeStr}<br/>
            {dateStr}<br/>
            <a href={userLink}>{image.user.name}</a>
          </p>
          <FBBlock like={true} className={fbClass}/>
        </div>
      </Swipable>
    );
  }

  onTagClick(evt) {
    var tagState = this.state.tagState;
    //console.log('onTagClick', tagState, (tagState + 1) % 3);
    tagState = (tagState + 1) % 3;
    this.setState({ tagState: tagState, animateTools: true });
    if (tagState == TAG_FORM_OFF) {
      const ffm = this;
      setTimeout(() => { ffm.setState({tagState: TAG_FORM_NONE}) }, 800);
    }
  }
  
  onFBClick(evt) {
    console.log('onFBClick', evt);
    window.scrollTo(0, window.innerHeight * .9);
    this.setState({ animateFB: true });
    const ffm = this;
    setTimeout(() => { ffm.setState({animateFB: false}) }, 2000);
  }

  onUploadClick(evt) {
    hashHistory.push('/upload');
  }

  onDeleteClick(e) {
    const image = ImageStore.getSelectedImage();//this.state.image;
    //console.log('delete clicked, image', image);
    /*
    if (!image || !window.confirm('Are you sure you want to delete ' + image.base + '.jpg?')) {
      return;
    }
    */
    var next = ImageStore.getNextImage();
    if (next && next.base === image.base) {
      // special case the last image
      next = null;
    }
    console.log('delete image: ' + image.base);
    request({
      method: 'DELETE',
      url: API_BASE_URL + '/api/v1/images' + image.root + '/' + image.base,
      headers: {
        'X-FF-Auth': authStore.getAccessToken()
      }
    }, (er, response, bodyString) => {
      if (er) {
        console.log('delete image problem: ' + er);
        reportError(er, 'problem deleting image');
        this.setState({ error: er });
        return;
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        var errObj = JSON.parse(bodyString);
        reportError(errObj, 'problem deleting image');
        this.setState({ error: errObj });
      } else {
        //console.log('delete image OK? code=' + response.statusCode);
        FFActions.imageDeleted(image, next);
        reportInfo('deleted ' + image.base + '.jpg');
      }
    });
  }
  onMouseEnter(evt) {
    /*console.log('onMouseEnter', evt);*/
    //this.setState({showToolbar: true});
  }

  onMouseOut(evt) {
    /*console.log('onMouseOut', evt);*/
    //this.setState({showToolbar: false});
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
    hashHistory.replace(newImage ? '/images' + newImage.path : '/');
  }
  
  log(msg) {
    //console.debug('FFMainImage: ' + msg + ' | mounted=' + this.mounted);
  }
}

class ImageToolbar extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { onTagClick, onStarClick, onDeleteClick, onFBClick, onUploadClick } = this.props;

    /* for when favorites are implemented
    (<Icon name="star" onClick={onStarClick}/>)
    */

    return (
      <div id="image-toolbar" className={ 'image-toolbar flex-column ' + (this.props.className || '')}>
        <Icon name="tags" title="edit tags" onClick={onTagClick}/>
        <Icon name="close" title="delete image" onClick={onDeleteClick}/>
        <Icon name="facebook" title="comment on Facebook" onClick={onFBClick}/>
        <Icon name="upload" title="upload an image" onClick={onUploadClick}/>
      </div>
    );
  }
}

export default FFMainImage;
