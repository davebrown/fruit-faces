import React from 'react';
import dateformat from 'dateformat';
import Swipable from 'react-swipeable';
import { Icon } from 'react-fa';
import request from 'browser-request';

import { amplitude, API_BASE_URL, history, reportError, reportInfo, responsiveWidth } from '../util/Util.js';
import FBBlock from './FBBlock.jsx';
import ImageStore from '../stores/ImageStore.js';
import { authStore } from '../stores/AuthStore.js';
import { IMAGE_CHANGED, IMAGES_LOADED, IMAGE_DELETED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import FFActions from '../actions/FFActions.js';
import TagForm from './TagForm.js';
import ImageToolbar from './ImageToolbar.jsx';

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
    this.onImageClick = this.onImageClick.bind(this);
    this.resolveSelectedImage = this.resolveSelectedImage.bind(this);
    this.retractTagForm = this.retractTagForm.bind(this);
  }

  mainImageActionListener(action) {
    switch (action.actionType) {
      case IMAGES_LOADED:
        // necessary for when we arrive with an image route selected,
        // but the images are not loaded yet...
        this.forceUpdate();
        break;
      case IMAGE_CHANGED:
        if (this.mounted) {
          this.setState( { image: action.image, animateTools: false } );
          this.props = { }; // clear out router state
        }
        break;
      case IMAGE_DELETED:
        if (this.mounted) {
          this.setState( { image: action.newImage, animateTools: false } );
          this.props = { }; // clear out router state
          history.replace(action.newImage ? '/images' + action.newImage.path : '/');

        }
        break;
    }
  }

  /* update selected image from router path params, if needed */
  resolveSelectedImage(props) {
    const params = props && props.match && props.match.params;
    if (params && params.imageBase) {
      const path = '/' + params.userId + '/' + params.imageBase;
      const image = ImageStore.getImage(path);
      this.setState({
        image: image,
        imagePath: path
      });
      if (image) {
        FFActions.imageChanged(image);
      }
    }
  }
  componentWillMount() {
    this.dispatcherToken = Dispatcher.register(this.mainImageActionListener);
    this.resolveSelectedImage(this.props);
    this.setState( {
      tagState: TAG_FORM_NONE,
      animateTools: true
    }
    );
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.resolveSelectedImage(nextProps);
  }

  componentWillUnmount() {
    this.mounted = false;
    var tmpToken = this.dispatcherToken;
    this.dispatcherToken = null;
    if (tmpToken) {
      Dispatcher.unregister(tmpToken);
    }
  }
  
  render() {
    var image = this.state.image;
    
    const { tagState, animateTools, imagePath } = this.state;
    if (!image && imagePath) {
      image = ImageStore.getImage(imagePath);
    }

    if (!image) {
      return (<div className="loading">whoops no image, wanted {imagePath}</div>);
    }
    var src = '/thumbs' + image.root + '/' + image.full;
    var tagForm = '';
    if (tagState != TAG_FORM_NONE) {
      var tagClass = '';
      if (animateTools) {
        if (responsiveWidth()) {
          tagClass = (tagState == TAG_FORM_ON) ? 'animated slideInLeft' : 'animated slideOutLeft';
        } else {
          tagClass = (tagState == TAG_FORM_ON) ? 'animated fadeInRight' : 'animated fadeOutRight';
        }
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
        <div id="main-image-holder" className="flex-container" onTouchStart={this.onTouchStart} onTouchEnd={this.onTouchEnd}
          onClick={this.onImageClick}
        >
          <img id="main-image" src={src} onMouseEnter={this.onMouseEnter} onMouseOut={this.onMouseOut}/>
          <ImageToolbar ref="imageToolbar" onFBClick={this.onFBClick} onTagClick={this.onTagClick}
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

  onImageClick(evt) {
    if (this.state.tagState == TAG_FORM_ON) {
      this.setState({ tagState: TAG_FORM_OFF });
      this.retractTagForm();
    }
  }
  onTagClick(evt) {
    var tagState = this.state.tagState;
    tagState = (tagState + 1) % 3;
    this.setState({ tagState: tagState, animateTools: true });
    if (tagState == TAG_FORM_OFF) {
      this.retractTagForm();
    }
  }

  retractTagForm() {
    const ffm = this;
    setTimeout(() => { ffm.setState({tagState: TAG_FORM_NONE}) }, 800);
  }
  
  onFBClick(evt) {
    window.scrollTo(0, window.innerHeight * .9);
    this.setState({ animateFB: true });
    const ffm = this;
    setTimeout(() => { ffm.setState({animateFB: false}) }, 2000);
  }

  onUploadClick(evt) {
    evt.stopPropagation();
    history.push('/upload');
  }

  onDeleteClick(e) {
    const image = ImageStore.getSelectedImage();
    if (!image || !window.confirm('Are you sure you want to delete ' + image.base + '.jpg?')) {
      return;
    }
    var next = ImageStore.getNextImage();
    if (next && next.base === image.base) {
      // special case the last image
      next = null;
    }
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
        FFActions.imageDeleted(image, next);
        reportInfo('deleted ' + image.base + '.jpg');
      }
    });
  }
  onMouseEnter(evt) {
    //this.setState({showToolbar: true});
  }

  onMouseOut(evt) {
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
  }

  onTouchEnd(event) {
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
    history.replace(newImage ? '/images' + newImage.path : '/');
  }
  
}

export default FFMainImage;
