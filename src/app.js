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
import FFDataVictory from './components/FFDataVictory.jsx';
import Tech from './components/Tech.jsx';
import About from './components/About.jsx';
import FFMainImage from './components/FFMainImage.js';

import { amplitude, API_BASE_URL } from './util/Util.js';

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
      //console.debug('FFTable.changeListener()');
      this.setState( { images: ImageStore.getImages() } );
    }
  }
  
  loadImageDefs() {
    var startTime = new Date().getTime();
    request(API_BASE_URL + '/api/v1/images', function(err, response, bodyString) {
      if (err) {
        amplitude.logEvent('IMAGE_CATALOG_LOAD_ERROR', { errMsg: '' + err });
        // BIG FIXME: swallowing error, need an error state and to render
        //throw err;
        return;
      }
      var body = JSON.parse(bodyString);
      var duration = new Date().getTime() - startTime;
      console.log("loaded " + body.length + " image(s) in " + duration + " ms");
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
      amplitude.logEvent('IMAGE_CATALOG_LOADED', { durationMillis: duration });
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
        <div className="fixed scrollable thumbs">
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
    // thumb divs are 30x40, making browser scale down makes for sharper resolution
    var dim = '60x80';
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
const Filters = () => (<div><h1>Filters</h1><p><i>Coming soon!</i></p></div>);

const Credits = () => (
  <div>
    <h1>Credits</h1>
    <p>Props to <a href="https://github.com/ianwremmel">Ian Remmel</a> for his JS advice and his
  straightforward <a href="http://ianwremmel.github.io/flexbox-layouts/">tutorial on FlexBox layouts.</a></p>
    <p>Thanks to <a href="http://aliciachastain.com/">Alica Chastain</a> for her design advice.</p>
    <p>Hugs to <a href="http://maisybrown.com/">Maisy</a> for eating all the fruit. I ❤ you!</p>
    </div>
);

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
            <Route path='/data' component={FFDataVictory}/>
            <Route path='/tech' component={Tech}/>
            <Route path='/credits' component={Credits}/>
            <Route path='/images/:imageId' component={FFMainImage}/>
         </Route>
        </Router>
    );
  }
}
if (process.env.NODE_ENV != 'production') {
  // debug niceties
  window.imageStore = ImageStore;
  window.hashHistory = hashHistory;
  window.bowser = bowser;
  window.amplitude = amplitude;
}


if (bowser.mobile || bowser.ipad) {
  // http://stackoverflow.com/questions/5284878/how-do-i-correctly-detect-orientation-change-using-javascript-and-phonegap-in-io
  /*
  window.onresize = function() {
    console.debug('onResize: w=' + window.innerWidth);
    FFActions.orientationChanged();
  }
  */
}

ReactDOM.render(<FFApp/>, document.getElementById('container'));

