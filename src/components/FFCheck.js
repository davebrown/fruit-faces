import React from 'react';
import request from 'browser-request';
import ImageStore from '../stores/ImageStore.js';

const API_BASE_URL = process.env.FF_BACKEND_URL || 'http://localhost:9080';

function imageHasTag(image, tag) {
  if (image) {
    if (!image.tags) image.tags = [];
    for (var i = 0, len = image.tags.length; i < len; i++) {
      if (tag === image.tags[i]) return true;
    }
  }
  return false;
}

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
  console.log('calling ' + verb + ' tag=' + tag + ' on ' + image.base);
  request({
    method:verb,
    url: API_BASE_URL + '/api/v1/images/' + image.base + '/tags/' + tag,
    headers: {
      'Content-Type': 'application/json'
    }
  }, function(er, response, bodyString) {
    if (er) {
      console.log('update tags problem: ' + er);
      throw er;
    }
    console.log('updateTag OK? code=' + response.statusCode);
  });
}


class FFCheck extends React.Component {
 constructor(props) {
   super(props);
   console.log('FFCheck image=' + props.image);
 }

  checkHandler() {
    var image = this.props.image;
    var fruit = this.props.fruit;
    console.log('checkhandler(' + image.base + ',' + fruit + ')');
    if (imageHasTag(image, fruit)) {
      console.log('removing tag');
      imageRemoveTag(image, fruit);
    } else {
      console.log('adding tag');
      imageAddTag(image, fruit);
    }
    //console.log('after handling tags are ' + JSON.stringify(image.tags));
    this.forceUpdate();
  }

  render() {
    //console.log('FFCheck(' + this.props.fruit + ').render()');
    var image = ImageStore.getSelectedImage();
    var fruit = this.props.fruit;
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
