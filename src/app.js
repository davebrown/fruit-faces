import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';
import request from 'browser-request';
import bowser from 'bowser';

import Dispatcher from './dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED } from './constants/FFConstants.js';
import FFActions from './actions/FFActions.js';
import ImageStore from './stores/ImageStore.js';
import Dialog from './components/Dialog.js';
import FFNav from './components/FFNav.js';
import FFData from './components/FFData.js';
import FFTech from './components/FFTech.js';
import FFMainImage from './components/FFMainImage.js';

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
        <div className="fixed thumbs">
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

//const Defalt = () => (<h1>Default</h1>);
const Defalt = null;
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
            <Route path='/data' component={FFData}/>
            <Route path='/tech' component={FFTech}/>
            <Route path='/images/:imageId' component={FFMainImage}/>
         </Route>
        </Router>
    );
  }
}
if (process.env.NODE_ENV != 'production') {
  window.imageStore = ImageStore;
  window.hashHistory = hashHistory;
}

ReactDOM.render(<FFApp/>, document.getElementById('container'));

