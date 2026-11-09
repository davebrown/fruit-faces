import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router, Route, Switch } from 'react-router';
import { BrowserRouter, Link } from 'react-router-dom';
import bowser from 'bowser';
import Notifications from './components/Notifications.jsx';

import FFActions from './actions/FFActions.js';
import ImageStore from './stores/ImageStore.js';
import Dialog from './components/Dialog.js';
import FFDataVictory from './components/FFDataVictory.jsx';
import Tech from './components/Tech.jsx';
import Home from './components/Home.jsx';
import About from './components/About.jsx';
import ThumbContainer from './components/ThumbContainer.jsx';
import FFMainImage from './components/FFMainImage.js';
import Upload from './components/Upload.jsx';
import Toastr from './components/Toastr.jsx';
import SideMenu from './components/SideMenu.jsx';
import Slideshow from './components/Slideshow.jsx';

import { amplitude, history } from './util/Util.js';
import { authStore } from './stores/AuthStore.js';

const NotFound = () => (
  <div>
    <h1>Not found</h1>
    <p>Hmmm...why not go <Link to="/">back home?</Link></p>
  </div>
);

const UnsupportedBrowser = () => (
  <div>
    <h2>Sorry, your browser won&apos;t work here :-(</h2>
    <p>We recommend that you try <a href="https://www.google.com/chrome/browser/desktop/index.html">Google Chrome</a> instead.</p>
  </div>
);
class FFContainer extends React.Component {
  render() {
    const homeComponent = Home;
    return (
      <div className="flex-container">
        <Notifications/>
        <ThumbContainer/>
        <Switch>
          <Route exact={true} path='/mosaic' component={null}/>
          <Route path="*">
            <Dialog>
              <Switch>  
                <Route exact={true} path='/' component={homeComponent}/>
                <Route exact={true} path='/_=_' component={homeComponent}/>
                <Route path='/about' component={About}/>
                <Route path='/data' component={FFDataVictory}/>
                <Route path='/tech' component={Tech}/>
                <Route path='/upload' component={Upload}/>
                <Route path="/slideshow" component={Slideshow}/>
                <Route path='/toastr' component={Toastr}/>
                <Route path='/images/:userId/:imageBase' component={FFMainImage}/>
                <Route path='*' component={NotFound}/>
              </Switch>
            </Dialog>
          </Route>
        </Switch>
      </div>
    );
  }
}

function keyDownHandler(evt) {
  if (evt.defaultPrevented || evt.altKey || evt.ctrlKey || evt.metaKey ||
      evt.target.closest?.('input, textarea, select, [contenteditable="true"]')) {
    return;
  }
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
    // Will hash history exhaust memory if my kid just hits right arrow for an hour?
    history.replace('/images' + newImage.path);
  }
}

class FFApp extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    document.addEventListener('keydown', keyDownHandler);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', keyDownHandler);
  }

  render() {
    if (bowser.msie && bowser.version <= '10.0') {
      return (<UnsupportedBrowser/>);
    }
    return (
      <Router history={history}>
        <main id="main" className="main">
          <SideMenu/>
          <FFContainer/>
        </main>
      </Router>
    );
  }
}
if (process.env.NODE_ENV != 'production') {
  // debug niceties
  window.imageStore = ImageStore;
  window.authStore = authStore;
  window.browserHistory = history;
  window.bowser = bowser;
  window.amplitude = amplitude;
  window.BrowserRouter = BrowserRouter;
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

createRoot(document.getElementById('container')).render(<FFApp/>);

