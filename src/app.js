import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';
import request from 'browser-request';
import bowser from 'bowser';
import dateformat from 'dateformat';

import Dispatcher from './dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED } from './constants/FFConstants.js';
import FFActions from './actions/FFActions.js';
import ImageStore from './stores/ImageStore.js';
import Dialog from './components/Dialog.js';
import FFNav from './components/FFNav.js';

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
    if (!this.state.images || this.state.images.length === 0) {
      console.debug('FFTable.changeListener()');
      this.setState( { images: ImageStore.getImages() } );
    }
  }
  
  loadImageDefs() {
    request(API_BASE_URL + '/images', function(er, response, bodyString) {
      if (er)
        throw er;
      var body = JSON.parse(bodyString);
      console.log("loaded " + body.length + " image(s)");
      window.FFImages = body;
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
    FFActions.imageChanged(this.props.image);
    hashHistory.push('/images/' + this.props.image.base);
  }

  render() {
    var dim = '30x40';
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
      var hash = '#/images/' + this.props.image.base;
      if (hash === window.location.hash) {
        selClass = 'thumb-selected';
      }
    }
    var to = '/images/' + this.props.image.base;
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
    url: 'http://localhost:9080/images/' + image.base + '/tags/' + tag,
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

var FRUITS = [ 'apple', 'bacon', 'banana', 'blackberry', 'blueberry', 'cantaloupe', 'cereal', 'cheese', 'clementine',
               'googly eyes', 'grape', 'honeydew', 'kiwi', 'mango',
               'peach', 'pear', 'pineapple', 'plum', 'raspberry', 'strawberry', 'try harder Dad!', 'watermelon' ];

var TAGS = [ 'blue', 'gray', 'white' ];

TAGS = TAGS.concat(FRUITS);

class TagForm extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.checkBoxes = new Set();
  }
  
  render() {
    /* FIXME: race condition on initial load, selected image still null, need to handle async properties */
    var image = ImageStore.getSelectedImage();
    console.log('TagForm selImage=' + image);
    return (
        <div id="tag-form" className="container tag-form">
        {
          TAGS.map((fruit) => {
            var key = 'ff-checkbox-' + fruit;
            return <FFCheck key={key} image={image} fruit={fruit}/>
          })
        }
      </div>
    );
  }
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

class FFMainImage extends React.Component {

  constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    this.log('CTOR');
    this.mounted = false;
    this.actionListener = this.actionListener.bind(this);
    //this.log = this.log.bind(this);
  }

  actionListener(action) {
    //console.log('FFMainImage.action: ' + action.actionType);
    switch (action.actionType) {
    case IMAGES_LOADED:
      // FIXME: necessary for when we arrive with an image route selected,
      // but the images are not loaded yet...
      this.forceUpdate();
      break;
    }
  }

  /*
    changeListener(action) {
    this.log('changeListener mounted=' + this.mounted);
    this.setState( { image: ImageStore.getSelectedImage() } );
  }
  */

  componentWillMount() {
    this.log('willMount');
    this.dispatcherToken = Dispatcher.register(this.actionListener);
    //ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  componentDidMount() {
    this.log('didMount');
    this.mounted = true;
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.log('willReceiveProps');
  }

  /*
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    this.log('shouldUpdate');
    console.debug(this.props);
    console.debug(nextProps);
    //var ret = super.shouldComponentUpdate(nextProps, nextState, nextContext);
    var ret = true;
    this.log('shouldUpdate->' + ret);
    return ret;
  }
  */

  componentWillUpdate(nextProps, nextState, nextContext) {
    this.log('willUpdate');
  }

  componentDidUpdate(nextProps, nextState, nextContext) {
    this.log('didUpdate');
  }

  componentWillUnmount() {
    this.log('willUnmount');
    this.mounted = false;
    var tmpToken = this.dispatcherToken;
    this.dispatcherToken = null;
    if (tmpToken)
      Dispatcher.unregister(tmpToken);
    //ImageStore.removeChangeListener(this.changeListener.bind(this));
  }
  
  render() {
    var imageId = this.props && this.props.params && this.props.params.imageId;
    this.log('render: imageId=' + imageId);
    var image = null;
    /*image = this.state.image;
    if (!this.state || !this.state.image) {
      this.log('nothing selected, returning NULL');
      return null;
    }
    */
    image = ImageStore.getImage(imageId);
    if (image === null) {
      this.log('no image or not found, returning null');
      return null;
    }
    var src = '/thumbs/' + image.full;
    var tagForm = <TagForm className="tag-form" image={image}/>;
    //var tagForm = '';
    // FIXME: should a component be doing this?
    window.location.hash = '/images/' + image.base;
    var dateStr = 'Unknown date...';
    if (image.timestamp) {
      dateStr = dateformat(new Date(image.timestamp), 'dddd mmmm d, yyyy h:MM TT');
    }
    return (<div>
            {tagForm}
            <img id="main-image" src={src}/>
            <p>{dateStr}</p>
            </div>
           );
    
  }

  log(msg) {
    //console.debug('FFMainImage: ' + msg + ' | mounted=' + this.mounted);
  }
}

const Defalt = () => (<h1>Default</h1>);
const About = () => (
  <div className="text">
    <h1>About</h1>
    <h2>Why</h2>
    <p>
    My family always has fruit for breakfast.
    </p>
    <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    </div>
);
const Filters = () => (<h1>Filters</h1>);

class FFContainer extends React.Component {
 constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    //ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  render() {
    return (
        <div className="container">
        <FFTable/>
        <Dialog>
        {this.props.children}
        </Dialog>
        <FFNav/>
        </div>
    );
  }
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
  if (newImage) {
    FFActions.imageChanged(newImage);
    // FIXME: will hash history exhaust memory if my kid just hits right arrow for an hour?
    //hashHistory.push('/images/' + newImage.base);
    hashHistory.replace('/images/' + newImage.base);
  }
}


// FIXME: don't like using global document handler, but I don't receive arrow key
// events if certain elements don't have focus
document.onkeydown = keyDownHandler;

function routeLocationDidUpdate(location) {
  console.debug('routeLocationUpdated: ');
  console.log(location);
}

//hashHistory.listen(location => routeLocationDidUpdate(location));

class FFApp extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <Router history={hashHistory}>
        <Route path='/' component={FFContainer}>
            <Route path='/' component={Defalt}/>
            <Route path='/about' component={About}/>
            <Route path='/filters' component={Filters}/>
            <Route path='/images/:imageId' component={FFMainImage}/>
         </Route>
        </Router>
    );
  }
}

ReactDOM.render(<FFApp/>, document.getElementById('container'));

