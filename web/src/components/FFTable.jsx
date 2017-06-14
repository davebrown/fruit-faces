import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';

import { Link } from 'react-router-dom';
import bowser from 'bowser';
import ReactTooltip from 'react-tooltip';

import ImageStore from '../stores/ImageStore.js';
import { amplitude, API_BASE_URL, errToString, imageHasTag, reportError, history } from '../util/Util.js';
import FFActions from '../actions/FFActions.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGE_ADDED, IMAGE_DELETED, KEY_NAV_HAPPENED } from '../constants/FFConstants.js';

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
    ImageStore.addChangeListener(this.tableChangeListener.bind(this));
    this.render.bind(this);
  }

  componentWillMount() {
    this.dispatcherToken = Dispatcher.register((action) => {
      switch (action.actionType) {
        case KEY_NAV_HAPPENED:
          showKeyTooltip = false;
          ReactTooltip.hide(ReactDOM.findDOMNode(this.refs.ff_table));
          ReactTooltip.hide();
          ReactTooltip.rebuild();
          break;
        case IMAGE_CHANGED:
        case IMAGE_ADDED:
        case IMAGE_DELETED:
          this.tableChangeListener(null);
          break;
      }
    });
  }

  componentWillUnmount() {
    Dispatcher.unregister(this.dispatcherToken);
  }
  
  tableChangeListener(arg) {
    const images = ImageStore.getImages();
    this.setState( {
      images: images,
      selectedImage: ImageStore.getSelectedImage(),
      filter: ImageStore.getFilterTag()
    });
    this.forceUpdate();
  }

  shouldComponentUpdate(nextProps, next) {
    var ret = false;
    const now = this.state;
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
    if (!images) {
      return (<h1 className="loading" style={{ color: '#808080', minWidth: '340px', marginTop: '20vh' }}>Loading thumbnails</h1>);
    } else if (images.length == 0) {
      return (<div className="thumbs">No fruit faces yet! Why not&nbsp;<Link to="/upload"> upload some?</Link></div>);
    }

    var up = String.fromCodePoint(0x2B06);
    var left = String.fromCodePoint(0x2B05);
    var right = String.fromCodePoint(0x27A1);
    var down = String.fromCodePoint(0x2B07);
    const ttClickText = "Click a thumbnail to see it larger";
    const ttKeyText  = "Save mouse clicks!<br/>You can use the<br/>"
                     + "left / right / up / down keys<br/>"
                     + left + ' ' + right + ' ' + up + ' ' + down + '<br/>'
                     + "to navigate the pictures instead";

    var ttText = null;
    var ttDisable = true;
    if (bowser.mobile) {
      ttDisable = true;
    } else if (showClickTooltip) {
      ttText = ttClickText;
      ttDisable = false;
    } else if (showKeyTooltip && clickCount >= 3) {
      ttText = ttKeyText;
      ttDisable = false;
    }

    const ttShowEvent = () => {
      if (showClickTooltip) {
        amplitude.logEvent('SHOWED_CLICK_TOOLTIP', {});
      } else if (showKeyTooltip) {
        amplitude.logEvent('SHOWED_KEY_TOOLTIP', { clickCount: clickCount });
      }
    };

    var content = (
      <div ref="ff_table" className="flex-container flex-fixed flex-wrap scrollable thumbs" data-for="table-tt"
      data-multiline={true} data-tip={ttText}
      >
        {
          this.state.images.map((image) => {
            var key = 'ff-thumb-' + image.id;
            return <FFThumb key={key} image={image} selected={selectedImage && selectedImage.path === image.path}/>;
          })
        }
        <ReactTooltip disable={ttDisable} id="table-tt" place="right" multiline={true}
          type="success" effect="float" afterShow={ ttShowEvent } />
      </div>
    );
    return content;
  }  
};

class FFThumb extends React.Component {

  constructor(props) {
    super(props);
  }

  clickHandler() {
    clickCount++;
    showClickTooltip = false;
    ReactTooltip.hide(ReactDOM.findDOMNode(this.refs.ff_table));
    ReactTooltip.rebuild();
  }

  render() {
    // thumb divs are 30x40, making browser scale down makes for sharper resolution
    const dim = '60x80';
    const { root, base } = this.props.image;
    var path = '/thumbs' + root + '/' + base + '_' + dim + '_t.jpg';
    var selClass = '';
    {
      if (ImageStore.getFilterTag() != null && !imageHasTag(this.props.image, ImageStore.getFilterTag())) {
        selClass = 'thumb-outside-filter';
      } else if (this.props.selected) {
        selClass = 'thumb-selected';
      }
    }
    const to = '/images' + this.props.image.path;
    return (
      <Link to={ to }>
      <div className={selClass} key={this.props.image.base}>
        <img src={path} onClick={this.clickHandler.bind(this)}/>
      </div>
    </Link>);
  }
};
