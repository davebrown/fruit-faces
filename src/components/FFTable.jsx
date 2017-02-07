import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import { hashHistory } from 'react-router';
import ImageStore from '../stores/ImageStore.js';
import { amplitude, API_BASE_URL, errToString, imageHasTag } from '../util/Util.js';
import FFActions from '../actions/FFActions.js';

function len(a) { return a && a.length; }

export default class FFTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      images: [],
      selectedImage: null,
      filter: null
    };
    ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  componentWillMount() {
    this.loadImageDefs();
  }

  changeListener(arg) {
    /*
    var nowBase = this.state.selectedImage && this.state.selectedImage.base;
    var sel = ImageStore.getSelectedImage();
    var nextBase = sel && sel.base;
    console.log('Table.changeListener() sel going from ' + nowBase + ' to ' + nextBase);
    */
    this.setState( {
      images: ImageStore.getImages(),
      selectedImage: ImageStore.getSelectedImage(),
      filter: ImageStore.getFilterTag()
    });
  }

  shouldComponentUpdate(nextProps, next) {
    var ret = false;
    const now = this.state;
    /*
    {
      var nowBase = now.selectedImage && now.selectedImage.base;
      var nextBase = next.selectedImage && next.selectedImage.base;
      console.log('Table.shouldUpdate() now.selected=' + nowBase + ' next=' + nextBase);
    }
    */
    // avoid deep comparison of all images
    if (len(now.images) != len(next.images) ||
        now.selectedImage !== next.selectedImage ||
        now.filter !== next.filter) {
      ret = true;
    }
    return ret;
  }
  
  render() {
    const { images, selectedImage, filter } = this.state;
    //if (!this.state.images || this.state.images.length == 0) {
    if (!images || images.length == 0) {
      return (<b>LOADING...</b>);
    }

    var old = (
      <div className="fixed scrollable thumbs">
        {
          this.state.images.map((image) => {
            var key = 'ff-thumb-' + image.base;
            return <FFThumb key={key} image={image} selected={selectedImage && selectedImage.base === image.base}/>;
          })
        }
      </div>
    );
    return old;
  }
  loadImageDefs() {
    var startTime = new Date().getTime();
    request(API_BASE_URL + '/api/v1/images', function(err, response, bodyString) {
      if (err) {
        amplitude.logEvent('IMAGE_CATALOG_LOAD_ERROR', { errMsg: '' + err });
        // BIG FIXME: swallowing error, need an error state and to render
        //throw err;
        return;
      }
      var body = JSON.parse(bodyString);
      var duration = new Date().getTime() - startTime;
      console.log("loaded " + body.length + " image(s) in " + duration + " ms");
      FFActions.imagesLoaded(body);
      /* need to set selected image state, if any, from hash path
       * FIXME: cleaner way to do this?
       */
      var location = hashHistory.getCurrentLocation();
      if (location && location.pathname) {
        var elems = location.pathname.split('/');
        if (elems.length === 3 && elems[1] === 'images') {
          var selImage = ImageStore.getImage(elems[2]);
          FFActions.imageChanged(selImage);
        }
      }
      amplitude.logEvent('IMAGE_CATALOG_LOADED', { durationMillis: duration });
    }.bind(this));
  }
  
};

class FFThumb extends React.Component {

  constructor(props) {
    super(props);
  }

  clickHandler() {
    FFActions.imageChanged(this.props.image);
    hashHistory.push('/images/' + this.props.image.base);
  }

  render() {
    // thumb divs are 30x40, making browser scale down makes for sharper resolution
    var dim = '60x80';
    if (false && bowser.mobile) {
      dim = '20x27';
    }
    var path = '/thumbs/' + this.props.image.base + '_' + dim + '_t.jpg';
    var selClass = '';
    /* race condition on route load...look at hash instead */
    //var selImage = ImageStore.getSelectedImage();
    //if (selImage && selImage.base === this.props.image.base) {
    //selClass = 'thumb-selected';
    //}
    {
      if (ImageStore.getFilterTag() != null && !imageHasTag(this.props.image, ImageStore.getFilterTag())) {
        selClass = 'thumb-outside-filter';
        //} else if (window.location.hash === ('#/images/' + this.props.image.base)) {
      } else if (this.props.selected) {
        selClass = 'thumb-selected';
      }
    }
    var to = '/images/' + this.props.image.base;
    return <div className={selClass} key={this.props.image.base}>
        <img src={path} onClick={this.clickHandler.bind(this)}/>
    </div>;
  }
};
