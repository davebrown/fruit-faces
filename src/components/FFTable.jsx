import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import { hashHistory } from 'react-router';
import ReactTooltip from 'react-tooltip';

import ImageStore from '../stores/ImageStore.js';
import { amplitude, API_BASE_URL, errToString, imageHasTag } from '../util/Util.js';
import FFActions from '../actions/FFActions.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { KEY_NAV_HAPPENED } from '../constants/FFConstants.js';

function len(a) { return a && a.length; }

// track state on whether or not to show tooltips
var showClickTooltip = true;
var showKeyTooltip = true;
var clickCount = 0;

export default class FFTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      images: [],
      selectedImage: null,
      filter: null
    };
    ImageStore.addChangeListener(this.changeListener.bind(this));
    this.render.bind(this);
    this.getTipContent.bind(this);
  }

  componentWillMount() {
    console.log('componentWillMount');
    this.loadImageDefs();
    this.dispatcherToken = Dispatcher.register((action) => {
      switch (action.actionType) {
        case KEY_NAV_HAPPENED:
          console.log('ff-table: keyNavHappened');
          showKeyTooltip = false;
          ReactTooltip.hide(ReactDOM.findDOMNode(this.refs.ff_table));
          ReactTooltip.hide();
          ReactTooltip.rebuild();
          break;
      }
    });
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    Dispatcher.unregister(this.dispatcherToken);
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

  getTipContent() {
    var up = String.fromCodePoint(0x2B06);
    var left = String.fromCodePoint(0x2B05);
    var right = String.fromCodePoint(0x27A1);
    var down = String.fromCodePoint(0x2B07);
    const ttClickText = "Click a thumbnail to see it larger";
    const ttKeyText  = "Save mouse clicks!<br/>You can use the<br/>"
                     + "left / right / up / down keys<br/>"
                     + left + ' ' + right + ' ' + up + ' ' + down + '<br/>'
                     + "to navigate the picutes instead";

    var ttText = null;
    if (showClickTooltip) {
      ttText = ttClickText;
      console.log('ttdisable false tttext=click');
    } else if (showKeyTooltip && clickCount >= 3) {
      ttText = ttKeyText;
      console.log('ttdisable false tttext=key');
    } else {
      console.log('ttdisable TRUE');
    }
    console.log('getTipContent->' + ttText);
    return ttText;
  }
  render() {
    //console.debug('FFTable.render() clickTip=' + showClickTooltip + ' keyTip=' + showKeyTooltip + ' clickCount=' + clickCount);
    const { images, selectedImage, filter } = this.state;
    if (!images || images.length == 0) {
      return (<b>LOADING...</b>);
    }

    var up = String.fromCodePoint(0x2B06);
    var left = String.fromCodePoint(0x2B05);
    var right = String.fromCodePoint(0x27A1);
    var down = String.fromCodePoint(0x2B07);
    const ttClickText = "Click a thumbnail to see it larger";
    const ttKeyText  = "Save mouse clicks!<br/>You can use the<br/>"
                     + "left / right / up / down keys<br/>"
                     + left + ' ' + right + ' ' + up + ' ' + down + '<br/>'
                     + "to navigate the picutes instead";

    var ttText = null;
    var ttDisable = true;
    if (showClickTooltip) {
      ttText = ttClickText;
      ttDisable = false;
      console.log('ttdisable false tttext=click');
    } else if (showKeyTooltip && clickCount >= 3) {
      ttText = ttKeyText;
      ttDisable = false;
      console.log('ttdisable false tttext=key');
    } else {
      console.log('ttdisable TRUE');
    }
    var old = (
      <div ref="ff_table" className="fixed scrollable thumbs" data-for="table-tt"
      data-multiline={true} data-tip={ttText}
      >
        {
          this.state.images.map((image) => {
            var key = 'ff-thumb-' + image.base;
            return <FFThumb key={key} image={image} selected={selectedImage && selectedImage.base === image.base}/>;
          })
        }
      <ReactTooltip disable={ttDisable}
        id="table-tt" place="right" multiline={true} type="success" effect="float"/>
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
    clickCount++;
    FFActions.imageChanged(this.props.image);
    hashHistory.push('/images/' + this.props.image.base);
    showClickTooltip = false;
    ReactTooltip.hide(ReactDOM.findDOMNode(this.refs.ff_table));
    ReactTooltip.hide();
    ReactTooltip.rebuild();
    if (clickCount == 3) {
      //ReactTooltip.show()
    }
  }

  render() {
    // thumb divs are 30x40, making browser scale down makes for sharper resolution
    var dim = '60x80';
    if (false && bowser.mobile) {
      dim = '20x27';
    }
    var path = '/thumbs/' + this.props.image.base + '_' + dim + '_t.jpg';
    var selClass = '';
    /* race condition on route load...look at hash instead?? */
    {
      if (ImageStore.getFilterTag() != null && !imageHasTag(this.props.image, ImageStore.getFilterTag())) {
        selClass = 'thumb-outside-filter';
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
