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
    console.debug('FFTable.changeListener()');
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
    FFActions.imageChanged(this.props.image);
  }

  render() {
    var dim = '30x40';
    if (false && bowser.mobile) {
      dim = '20x27';
    }
    var path = '/thumbs/' + this.props.image.base + '_' + dim + '_t.jpg';
    var selImage = ImageStore.getSelectedImage();
    var selClass = '';
    if (selImage && selImage.base === this.props.image.base) {
      selClass = 'thumb-selected';
    }
    var to = '/images/' + this.props.image.base;
    return <div className={selClass} key={this.props.image.base}>
      <Link to={to}>
      <img src={path} onClick={this.clickHandler.bind(this)}/>
      </Link>
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
    console.log('action: ' + action.actionType);
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
    console.debug('FFMainImage: ' + msg + ' | mounted=' + this.mounted);
  }
}

class FFMain extends React.Component {

  constructor(props) {
    super(props);
    //Dispatcher.register(this.changeListener.bind(this));
    //ImageStore.addChangeListener(this.changeListener.bind(this));
  }

  changeListener(action) {
    console.debug('FFMain.changeListener');
    // switch (action.actionType) {
    // case IMAGE_CHANGED:
    //   this.setState({image: action.image });
    //   break;
    // }
    this.setState( { image: ImageStore.getSelectedImage() } );
  }

  dialogCloseHandler() {
    console.log('FFMain: dialog close');
    FFActions.imageChanged(null);
    // FIXME: should a component be doing this?
    window.location.hash = '/';
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
    //var dialog = null;
    //dialog = (<FFMainImage/>);
    /*
    if (dialog === null || ImageStore.getSelectedImage() === null) {
      dialog = (<div className="expandable compressible red-border"></div>);
    }
    */
    console.log('FFMain.render()');
    return (
        <div className="main">
        <Dialog onClose={this.dialogCloseHandler.bind(this)}>
            <Route path='/' component={Defalt}/>
            <Route path='/about' component={About}/>
            <Route path='/filters' component={Filters}/>
            <Route path='/images/:imageId' component={FFMainImage}/>
        </Dialog>
        <div className="expandable compressible red-border"></div>
        </div>
    );
  }
}

const Defalt = () => (<h1>Default</h1>);
const About = () => (<h1>About</h1>);
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
  if (newImage) {
    FFActions.imageChanged(newImage);
    hashHistory.push('/images/' + newImage.base);
  }
}


// FIXME: don't like using global document handler, but I don't receive arrow key
// events if certain elements don't have focus
document.onkeydown = keyDownHandler;

function routeLocationDidUpdate(location) {
  console.debug('routeLocationUpdated: ');
  console.log(location);
}

hashHistory.listen(location => routeLocationDidUpdate(location));

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
//ReactDOM.render(<FFMain/>, document.getElementById('main'));
//ReactDOM.render(<FFTable/>, document.getElementById('thumbs'));

