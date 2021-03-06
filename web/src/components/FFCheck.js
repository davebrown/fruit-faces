import React, { PropTypes } from 'react';
import request from 'browser-request';
import ImageStore from '../stores/ImageStore.js';
import { API_BASE_URL, imageHasTag, reportError } from '../util/Util.js';
import { authStore } from '../stores/AuthStore.js';

function imageRemoveTag(image, tag) {
  if (!image.tags) image.tags = [];
  image.tags = image.tags.filter((val) => { return val !== tag; });
  tagImage(image, 'DELETE', tag);  
}

function imageAddTag(image, tag) {
  if (!image.tags) image.tags = [];
  if (image.tags.indexOf(tag) === -1) {
    image.tags.push(tag);
  }
  tagImage(image, 'POST', tag);
}

function tagImage(image, verb, tag) {
  //console.log('calling ' + verb + ' tag=' + tag + ' on ' + image.base);
  request({
    method: verb,
    url: API_BASE_URL + '/api/v1/images' + image.root + '/' + image.base + '/tags/' + tag,
    headers: {
      'Content-Type': 'application/json',
      'X-FF-Auth': authStore.getAccessToken()
    }
  }, (er, response, bodyString) => {
    if (er) {
      console.log('update tags problem: ' + er);
      reportError(er, 'problem changing tags');
    } else if (response.statusCode === 403) {
      var errMessage = authStore.getAccessToken() ? 'Not owner of image' : 'Must login to change tags';
      reportError(errMessage, 'Problem changing tags');
    } else if (response.statusCode < 200 || response.statusCode > 299) {
      // FIXME: need to undo local check state in ImageStore and in UI when this happens
      var errObj = JSON.parse(bodyString);
      reportError(errObj, 'problem changing tags');
    }
  });
}


class FFCheck extends React.Component {

  static propTypes = {
    image: PropTypes.object,
    fruit: PropTypes.string
  };

  static defaultProps = {
    image: null,
    fruit: null
  };

  constructor(props) {
   super(props);
  }

  checkHandler() {
    var image = this.props.image;
    var fruit = this.props.fruit;
    if (imageHasTag(image, fruit)) {
      imageRemoveTag(image, fruit);
    } else {
      imageAddTag(image, fruit);
    }
    this.forceUpdate();
  }

  render() {
    const { image, fruit } = this.props;
    var key = 'checkbox-' + fruit;
    var checked = imageHasTag(image, fruit);
    var checkStr = '';
    if (checked) {
      checkStr = 'checked';
    }
    return (
      <div key={key} className="tag-check">
        <label>
          <input checked={checkStr} onChange={this.checkHandler.bind(this)} type="checkbox"/>
          <i className="form-icon"></i> {fruit}
        </label>
      </div>);
  }
}

export default FFCheck;
