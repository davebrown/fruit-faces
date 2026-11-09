import React from 'react';
import PropTypes from 'prop-types';
import request from 'browser-request';

import { Link } from 'react-router-dom';
import bowser from 'bowser';
import { Tooltip } from 'react-tooltip';
import Icon from './Icon.jsx';

import Filters from './Filters.jsx';
import ImageStore from '../stores/ImageStore.js';
import { amplitude, API_BASE_URL, errToString, imageHasTag, reportError, history } from '../util/Util.js';
import FFActions from '../actions/FFActions.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { SIDE_MENU_OPENED, KEY_NAV_HAPPENED } from '../constants/FFConstants.js';

function len(a) { return a && a.length; }

// track state on whether or not to show tooltips
var showKeyTooltip = true;
var clickCount = 0;

const FILTER_FORM_NONE = 0;
const FILTER_FORM_ON = 1;
const FILTER_FORM_OFF = 2;

export default class Mosaic extends React.Component {

  constructor(props) {
    super(props);
    this.state = { filterState: FILTER_FORM_NONE, clickCount, showKeyTooltip, tooltipOpen: false };
    this.onFilterClick = this.onFilterClick.bind(this);
    this.retractFilterForm = this.retractFilterForm.bind(this);
    this.onThumbnailClick = this.onThumbnailClick.bind(this);
  }

  componentDidMount() {
    this.dispatcherToken = Dispatcher.register((action) => {
      switch (action.actionType) {
        case KEY_NAV_HAPPENED:
          showKeyTooltip = false;
          this.setState({ showKeyTooltip });
          break;
        case SIDE_MENU_OPENED:
          this.setState({filterState: FILTER_FORM_NONE });
          break;
      }
    });
  }

  componentWillUnmount() {
    if (this.dispatcherToken) {
      Dispatcher.unregister(this.dispatcherToken);
    }
    this.dispatcherToken = null;
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    var ret = false;
    const now = this.props;
    // avoid deep comparison of all images
    if (len(now.images) != len(nextProps.images) ||
        now.selectedImage !== nextProps.selectedImage ||
        now.filter !== nextProps.filter) {
      ret = true;
    }
    if (this.state.filterState !== nextState.filterState ||
        this.state.clickCount !== nextState.clickCount ||
        this.state.showKeyTooltip !== nextState.showKeyTooltip ||
        this.state.tooltipOpen !== nextState.tooltipOpen) {
      ret = true;
    }
    return ret;
  }

  onThumbnailClick() {
    this.setState(state => ({ clickCount: state.clickCount + 1, tooltipOpen: true }), () => {
      clickCount = this.state.clickCount;
    });
  }

  onFilterClick(e) {
    var filterState = this.state.filterState;
    const old = filterState;
    filterState = (filterState + 1) % 3;
    this.setState({ filterState: filterState });
    if (filterState == FILTER_FORM_OFF) {
      this.retractFilterForm();
    }
  }

  retractFilterForm() {
    const m = this;
    setTimeout(() => {
      m.setState({filterState: FILTER_FORM_NONE});
    },
    800);
  }
  
  render() {
    var { images, selectedImage, filter } = this.props;
    const { filterState, clickCount, showKeyTooltip } = this.state;
    images = ImageStore.getImages();
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

    var ttText = '';
    var ttDisable = true;
    if (bowser.mobile) {
      ttDisable = true;
    } else if (clickCount === 0) {
      ttText = ttClickText;
      ttDisable = false;
    } else if (showKeyTooltip && clickCount >= 1) {
      ttText = ttKeyText;
      ttDisable = false;
    }

    const ttShowEvent = () => {
      if (clickCount === 0) {
        amplitude.logEvent('SHOWED_CLICK_TOOLTIP', {});
      } else if (showKeyTooltip) {
        amplitude.logEvent('SHOWED_KEY_TOOLTIP', { clickCount: clickCount });
      }
    };

    
    var filterForm = '';
    if (filterState != FILTER_FORM_NONE) {
      var filterClass = (filterState == FILTER_FORM_ON) ? 'animated fadeInDown' : 'animated fadeOutUp';
      filterForm = (<Filters className={filterClass}/>);
    }
    var content = (
      <div className="flex-column">
        <div className="flex-container thumbs mosaic-toolbar">
          <Icon name="filter" title="filters" onClick={this.onFilterClick}/>
          &nbsp; &nbsp;
          <Icon id="mosaic-upload-link" name="upload" title="upload a fruit face" onClick={() => { history.push('/upload'); }}/>
        </div>
        {filterForm}
        <div id="mosaic-grid" className="flex-container flex-fixed flex-wrap scrollable thumbs"
          data-tooltip-id="table-tt"
          onMouseEnter={() => this.setState({ tooltipOpen: true })}
          onMouseLeave={() => this.setState({ tooltipOpen: false })}
        >
          {
            images.map((image) => {
              var key = 'ff-thumb-' + image.id;
              return <FFThumb key={key} image={image} selected={selectedImage && selectedImage.path === image.path}
                onClick={this.onThumbnailClick}/>;
            })
          }
        </div>
        {!ttDisable &&
          <Tooltip id="table-tt" anchorSelect="#mosaic-grid" place="right"
            variant="success" float opacity={1} isOpen={this.state.tooltipOpen}
            setIsOpen={tooltipOpen => this.setState({ tooltipOpen })}
            afterShow={ttShowEvent}>
            {ttText.split('<br/>').map((line, index) => <React.Fragment key={index}>
              {index > 0 && <br/>}{line}
            </React.Fragment>)}
          </Tooltip>
        }
      </div>
    );
    return content;
  }  
};

class FFThumb extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    // thumb divs are 30x40, making browser scale down makes for sharper resolution
    const dim = '60x80';
    const { root, base, ext } = this.props.image;
    var path = '/thumbs' + root + '/' + base + '_' + dim + '_t.' + ext;
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
      <Link to={ to } onClick={this.props.onClick}>
      <div className={selClass} key={this.props.image.base}>
        <img src={path}/>
      </div>
    </Link>);
  }
};
