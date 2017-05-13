import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';
import request from 'browser-request';
import bowser from 'bowser';
import { ToastContainer, ToastMessage } from 'react-toastr';

import Dispatcher from './dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED, STATUS_REPORT } from './constants/FFConstants.js';
import FFActions from './actions/FFActions.js';
import ImageStore from './stores/ImageStore.js';
import Dialog from './components/Dialog.js';
import FFNav from './components/FFNav.js';
import FFDataVictory from './components/FFDataVictory.jsx';
import Tech from './components/Tech.jsx';
import About from './components/About.jsx';
import Filters from './components/Filters.jsx';
import FFTable from './components/FFTable.jsx';
import FFMainImage from './components/FFMainImage.js';
import FBLogin from './components/FBLogin.jsx';
import Upload from './components/Upload.jsx';
import Toastr from './components/Toastr.jsx';

import { amplitude, API_BASE_URL, errToString, imageHasTag, reportError, reportWarning, reportSuccess, reportInfo } from './util/Util.js';
import { authStore, FB_APP_ID } from './stores/AuthStore.js';

const NotFound = () => (
  <div>
    <h1>Not found</h1>
    <p>Hmmm...why not go <Link to="/">back home?</Link></p>
  </div>
);

const ToastMessageFactory = React.createFactory(ToastMessage.animation);

class FFContainer extends React.Component {
 constructor(props) {
    super(props);
    Dispatcher.register(this.statusListener.bind(this));
    //ImageStore.addChangeListener(this.changeListener.bind(this));
 }

  statusListener(action) {
    switch (action.actionType) {
        case STATUS_REPORT:
        console.log('FFContainer.status', action);
        const opts =  {
          timeOut: 3000,
          extendedTimeOut: 10000,
          preventDuplicates: true,
          closeButton: true
        };
        const cont = this.refs.container;
        
        switch (action.statusType) {
          case 'success':
            cont.success(action.message, action.title, opts);
            break;
          case 'warning':
            cont.warning(action.message, action.title, opts);
            break;
          case 'info':
            cont.info(action.message, action.title, opts);
            break;
          case 'error':
          default:
            cont.error(action.message, action.title, opts);
            break;
        }
    }
  }

  render() {
    //var len = this.props.children && this.props.children.length;
    //console.log('container: children', len);
    // FIXME: hack to work around router weirdness
    var children;
    if (this.props.children) {
      children = this.props.children;
    } else if (!bowser.mobile) {
      children = (<About/>);
    }
    
    var toastTest = null;
    /*
    toastTest = (<div>
    <button onClick={() => reportError('bad thing happened', 'oops', 'error')}>Error Button</button>
    <button onClick={() => reportSuccess('good thing happened', 'GREAT!', 'success')}>Success Button</button>
    <button onClick={() => reportWarning('might be bad', 'WARNING', 'warning')}>Warning Button</button>
    <button onClick={() => reportInfo('very neutral something', 'FYI', 'info')}>Info Button</button>
    </div>);
    */
    return (
        <div className="container">
          <ToastContainer ref="container"
            toastMessageFactory={ToastMessageFactory}
            className="toast-top-right" />
        <FFTable/>
        <Dialog>
        {children}
        </Dialog>
        <FFNav/>
        </div>
    );
  }
}

function keyDownHandler(evt) {
  var newImage = null;
  var direction = null;
  switch (evt.keyCode) {
    case 39: // right arrow
      newImage = ImageStore.getNextImage();
      direction = 'right';
      break;
    case 37: // left
      newImage = ImageStore.getPreviousImage();
      direction = 'left';
      break;
    case 40: // down
      // squelch arrow key window scroll
      evt.preventDefault();
      newImage = ImageStore.getBelowImage();
      direction = 'down';
      break;
    case 38: // up
      // squelch arrow key window scroll
      evt.preventDefault();
      newImage = ImageStore.getAboveImage();
      direction = 'up';
      break;
  }
  if (newImage) {
    amplitude.logEvent('KEY_NAV', { direction: direction, image: newImage.base || 'none' });
    FFActions.keyNavHappened(evt.keyCode);
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
//hashHistory.listen(location => function(location) { console.log('hashHistory changed', location); });

class FFApp extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Router history={hashHistory}>
        <Route path='/' component={FFContainer}>
          <Route path='/about' component={About}/>
          <Route path='/filters' component={Filters}/>
          <Route path='/data' component={FFDataVictory}/>
          <Route path='/tech' component={Tech}/>
          <Route path='/login' component={FBLogin}/>
          <Route path='/upload' component={Upload}/>
          <Route path='/toastr' component={Toastr}/>
          <Route path='/images/:imageId' component={FFMainImage}/>
          <Route path='*' component={NotFound}/>
        </Route>
      </Router>
    );
  }
}
if (process.env.NODE_ENV != 'production') {
  // debug niceties
  window.imageStore = ImageStore;
  window.authStore = authStore;
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

