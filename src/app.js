import React from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import Dispatcher from './dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED } from './constants/FFConstants.js';
import FFActions from './actions/FFActions.js';
import ImageStore from './stores/ImageStore.js';
import bowser from 'bowser';

class FFTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = { images: [] };
    ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  componentWillMount() {
    this.loadImageDefs();
  }

  changeListener() {
    this.setState( { images: ImageStore.getImages() } );
  }
  

  loadImageDefs() {
    request('http://localhost:9080/images', function(er, response, bodyString) {
      if (er)
        throw er;
      var body = JSON.parse(bodyString);
      console.log("loaded " + body.length + " image(s)");
      /*
      for (var i = 0; i < body.length; i++) {
        console.log(body[i].base);
      }*/
      //this.setState( { images: body } );
      FFActions.imagesLoaded(body);
    }.bind(this));
  }

  render() {
    if (!this.state.images || this.state.images.length == 0) {
      return (<b>LOADING...</b>);
    }
    var nums = [];
    for (var i = 0; i < 24; i++) {
      nums.push(i);
    }
    var cols = nums.map((num) => {
      var key = 'cols-' + num;
      return (<div className="thirty" key={key}>{num}</div>);
    });

    var blues = ImageStore.getBlues();
    var grays = ImageStore.getNonBlues();
    var images = this.state.images;
    var images = imageList(HEART_21, blues, grays);
    
    var old = (
        <div className="thumbs">
        {
          images.map((image) => {
            var key = 'ff-thumb-' + image.base;
            return <FFThumb key={key} image={image}/>;
          })
        }
      </div>
    );
    return old;
  }
};

const MOBILE_HEART_9 = '000000000011101110111111111011111110001111100000111000000010000000000000';
const MOBILE_HEART_10 = '00000000000111011100111111111001111111000011111000000111000000001000000000000000';
const MOBILE_HEART_11 = '0000000000000111011100011111111100011111110000011111000000011100000000010000000000000000';
const HEART_21 = '000000000000000000000000111100000001111000011111110000011111110111111111101111111111011111111111111111110000111111111111111000000001111111111100000000000011111110000000000000000111000000000000000000010000000000000000000000000000000'

function imageList(map, blues, grays) {
  var ret = [];
  for (var i = 0; blues.length > 0 && grays.length; i++) {
    var c = map[i % map.length];
    switch (c) {
    case '0':
      ret.push(grays.pop());
      break;
    case '1':
      ret.push(blues.pop());
      break;
    default:
      throw new Error('invalid map value: ' + c);
    }
  }
  //console.log('end pattern loop, leftover blues=' + blues.length + " grays=" + grays.length);
  var leftover = blues.length > 0 ? blues: grays;
  while (leftover.length > 0)
    ret.push(leftover.pop());
  return ret;
}

class ThumbEmitter {

  constructor(map, blues, grays) {
    this.map = map;
    this.blues = blues;
    this.grays = grays;
    this.index = 0;
    this.len = map.length;
  }

  
  
}

class FFThumb extends React.Component {

  constructor(props) {
    super(props);
  }

  clickHandler() {
    //document.getElementById('main-image').src = '/thumbs/' + this.props.image.full;
    FFActions.imageChanged(this.props.image);
  }
  
  render() {
    var dim = '30x40';
    if (false && bowser.mobile) {
      dim = '20x27';
    }
    var path = '/thumbs/' + this.props.image.base + '_' + dim + '_t.jpg';
    var selImage = ImageStore.getSelectedImage();
    var selClass = "";
    if (selImage && selImage.base === this.props.image.base) {
      selClass = 'thumb-selected';
    }
    return <div className={selClass} key={this.props.image.base}>
      <img src={path} onClick={this.clickHandler.bind(this)}/>
      </div>;
  }
};

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
  updateTagDB(image);
}

function imageAddTag(image, tag) {
  if (!image.tags) image.tags = [];
  if (image.tags.indexOf(tag) === -1) {
    image.tags.push(tag);
  }
  updateTagDB(image);
}


function keyDownHandler(arg) {
  var newImage = null;
  switch (arg.keyCode) {
  case 39: // right arrow
    newImage = ImageStore.getNextImage();
    break;
  case 37: // left
    newImage = ImageStore.getPreviousImage();
    break;
  case 40: // down
    break;
  case 38: // up
    break;
  }
  if (newImage) FFActions.imageChanged(newImage);
}

document.onkeydown = keyDownHandler;

function updateTagDB(image) {
  var body = JSON.stringify(image.tags);
  console.log('updating "' + image.base + '" with tags ' + body);
  request({
    method:'POST',
    url: 'http://localhost:9080/images/' + image.base + '/tags',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body
  }, function(er, response, bodyString) {
    if (er) {
      console.log('update tags problem: ' + er);
      throw er;
    }
    console.log('updateTagDB OK? code=' + response.statusCode);
  });
}

var FRUITS = [ 'apple', 'bacon', 'banana', 'blueberry', 'cantaloupe', 'cheese', 'clementine',
               'grape', 'honeydew', 'kiwi', 'mango',
               'peach', 'pear', 'pineapple', 'plum', 'raspberry', 'strawberry', 'watermelon' ];

var TAGS = [ 'blue', 'gray', 'white' ];

class TagForm extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.checkBoxes = new Set();
  }
  
  render() {
    var image = ImageStore.getSelectedImage();
    return (
        <div id="tag-form" className="tag-form">
        <ul>
        {
          TAGS.map((fruit) => {
            var key = 'ff-checkbox-' + fruit;
            return <FFCheck key={key} image={image} fruit={fruit}/>
          })
        }
      </ul>
      </div>
    );
  }
}

class FFCheck extends React.Component {
 constructor(props) {
    super(props);
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
    return (<li key={key}><input checked={checkStr} onChange={this.checkHandler.bind(this)} type="checkbox"/><label>{fruit}</label></li>);
  }

}
class FFMain extends React.Component {

  constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  changeListener(action) {
    /*
    console.log('FFMain.changeListener(' + action + ')');
    switch (action.actionType) {
    case IMAGE_CHANGED:
      this.setState({image: action.image });
      break;
    }
    */
    this.setState( { image: ImageStore.getSelectedImage() } );
  }

  dialogCloseHandler() {
    //console.log('dialog close');
    FFActions.imageChanged(null);
  }

  render() {
    if (!this.state || !this.state.image) {
      return <h2>Select an image!</h2>;
    }
    var mainDiv = document.getElementById('main');
    if (imageHasTag(this.state.image, 'blue')) {
      mainDiv.style = 'background-color: blue;';
    } else if (imageHasTag(this.state.image, 'gray')) {
      mainDiv.style = 'background-color: gray;';
    } else if (imageHasTag(this.state.image, 'white')) {
      mainDiv.style = 'background-color: white;';
    } else {
      mainDiv.style = 'background-color: red;';
    }
      
    var src = '/thumbs/' + this.state.image.full;
    var tagForm = <TagForm className="tag-form" image={this.state.image}/>;
    return (<div className="dialog">
            {tagForm}
            <button onClick={this.dialogCloseHandler.bind(this)}>X</button>
            <img id="main-image" src={src}/><br/>
            <i>{this.state.image.date || 'Unknown date...'}</i>
            </div>);
  }
}
ReactDOM.render(<FFMain/>, document.getElementById('main'));
ReactDOM.render(<FFTable/>, document.getElementById('thumbs'));
