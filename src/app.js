import React from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import Dispatcher from './dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED } from './constants/FFConstants.js';
import FFActions from './actions/FFActions.js';
import ImageStore from './stores/ImageStore.js';
import bowser from 'bowser';
import dateformat from 'dateformat';

const API_BASE_URL = process.env.FF_BACKEND_URL || 'http://localhost:9080';

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
    request(API_BASE_URL + '/images', function(er, response, bodyString) {
      if (er)
        throw er;
      var body = JSON.parse(bodyString);
      console.log("loaded " + body.length + " image(s)");
      window.FFImages = body;
      FFActions.imagesLoaded(body);
      // FIXME: move to React routes
      var hash = window.location.hash;
      if (hash) {
        var elems = hash.split('/');
        if (elems && elems.length === 3) {
          var image = ImageStore.getImage(elems[2]);
          console.log('selecting image from hash: ' + elems[2] + '/' + image);
          FFActions.imageChanged(image);
        }
      }
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
    
    var old = (
        <div className="scrollable fixed thumbs">
        {
          this.state.images.map((image) => {
            var key = 'ff-thumb-' + image.base;
            return <FFThumb key={key} image={image}/>;
          })
        }
      </div>
    );
    /*
    for (var i = 0; i < this.state.images.length; i++) {
      console.log(i + '/' + this.state.images[i].index);
    }*/
    return old;
  }
};

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
    console.log('right arrow, new image ' + newImage);
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

class FFDialog extends React.Component {

  constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  changeListener(action) {
    this.setState( { image: ImageStore.getSelectedImage() } );
  }
  
  dialogCloseHandler() {
    //console.log('dialog close');
    FFActions.imageChanged(null);
  }

  render() {
    if (!this.state || !this.state.image) {
      return null;
    }
    var src = '/thumbs/' + this.state.image.full;
    //var tagForm = <TagForm className="tag-form" image={this.state.image}/>;
    var tagForm = '';
    window.location.hash = '/images/' + this.state.image.base;
    var dateStr = 'Unknown date...';
    if (this.state.image.timestamp) {
      dateStr = dateformat(new Date(this.state.image.timestamp), 'dddd mmmm d, yyyy h:MM TT');
    }
    return (<div className="column dialog expandable compressible">
            {tagForm}
            <button onClick={this.dialogCloseHandler.bind(this)}>X</button>
            <img id="main-image" src={src}/>
            <p>{dateStr}</p>
            </div>
           );
  }
}

class FFMain extends React.Component {

  constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  changeListener(action) {
    // console.log('FFMain.changeListener(' + action + ')');
    // switch (action.actionType) {
    // case IMAGE_CHANGED:
    //   this.setState({image: action.image });
    //   break;
    // }
    this.setState( { image: ImageStore.getSelectedImage() } );
  }

  render() {
    /*
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
    */
    var dialog = null;
    dialog = (<FFDialog/>);
    /*
    if (dialog === null || ImageStore.getSelectedImage() === null) {
      dialog = (<div className="expandable compressible red-border"></div>);
    }
    */
    return (
        <div className="main">
        {dialog}
        <div className="expandable compressible red-border"></div>
        <FFNav/>
        </div>
    );
  }
}

class FFNav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<div className="nav fixed">
      <ul>
        <li>About</li>
        <li>Filters</li>
        <li>Data</li>
        <li>Slideshow</li>
        <li>Tech</li>
        <li>Credits</li>
      </ul>
     </div>
           );
    
  }
}

class FFApp extends React.Component {
 constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    //ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  render() {
    return (
      <div className="container">
        <FFTable/>
        <FFMain/>
      </div>
    );
  }
}
ReactDOM.render(<FFApp/>, document.getElementById('container'));
//ReactDOM.render(<FFMain/>, document.getElementById('main'));
//ReactDOM.render(<FFTable/>, document.getElementById('thumbs'));

