import React, { PropTypes } from 'react';
import request from 'browser-request';
import ImageStore from '../stores/ImageStore.js';
import { API_BASE_URL, imageHasTag, reportError } from '../util/Util.js';

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
    method:verb,
    url: API_BASE_URL + '/api/v1/images/' + image.base + '/tags/' + tag,
    headers: {
      'Content-Type': 'application/json'
    }
  }, function(er, response, bodyString) {
    if (er) {
      console.log('update tags problem: ' + er);
      reportError(er);
      throw er;
    }
    //console.log('updateTag OK? code=' + response.statusCode);
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
    //console.log('FFCheck(' + this.props.fruit + ').render()');
    const { image, fruit } = this.props;
    var key = 'checkbox-' + fruit;
    var checked = imageHasTag(image, fruit);
    var checkStr = '';
    if (checked) {
      //console.log('checkbox rendering checked image for ' + image.base);
      checkStr = 'checked';
    } else {
      //console.log(fruit + ' NOT checked');
    }
    return (<div key={key} className="tag-check">
            <input checked={checkStr} onChange={this.checkHandler.bind(this)} type="checkbox"/>
            <label>{fruit}</label>
            </div>);
  }
}

export default FFCheck;
