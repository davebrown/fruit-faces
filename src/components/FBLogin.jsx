import React from 'react';
import { Link } from 'react-router';
import FacebookLogin from 'react-facebook-login';
import request from 'browser-request';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { FB_INITIALIZED, FB_AUTH_CHANGED } from '../constants/FFConstants.js';
import { authStore, FB_APP_ID, fbLoginCallback } from '../stores/AuthStore.js';

export default class FBLogin extends React.Component {

  constructor(props) {
    super(props);
    this.dispatchHandler = this.dispatchHandler.bind(this);
    this.authChanged = this.authChanged.bind(this);
  }

  componentWillMount() {
    authStore.addChangeListener(this.authChanged);
    this.authChanged();
    return;
    if (typeof(FB) !== 'undefined') {
      //FB.getLoginStatus(this.fbLoginCallback);
    } else {
      //this.dispatcherToken = Dispatcher.register(this.dispatchHandler);
      console.log('FBLogin componentWillMount - dispatch token is ' + this.dispatcherToken);
    }      
  }

  componentWillUnmount() {
    console.log('FBLogin - will unmount');
    authStore.removeChangeListener(this.authChanged);
    if (this.dispatcherToken) {
      Dispatcher.unregister(this.dispatcherToken);
    }
    this.dipatcherToken = null;
  }

  authChanged() {
    console.log('FBLogin.authChanged');
    this.setState({
      userId: authStore.getUserID(),
      name: authStore.getFullName(),
      profilePicUrl: authStore.getProfilePicUrl()
    });
  }    
  
  dispatchHandler(action) {
    if (true) return;
    switch (action.actionType) {
      case FB_INITIALIZED:
        console.log('FBLogin event callback - FB init done');
        this.setState({FB: FB});
        FB.getLoginStatus(this.fbLoginCallback);
        break;
      default:
        break;
    }
  }

  /*
  fbLoginCallback(response) {
    console.log(' ----- fbLoginCallback()', response);
    this.setState({login: response});
    if (response.status === 'connected') {
      FB.api('/me', (rsp) => {
        if (!rsp || rsp.error) {
          console.warn('FBLogin.jsx: FB api error', rsp);
          return;
        }
        this.setState({fullName: rsp.name});
      });
    }
  }
  */
  
  render() {
    console.log('FBLogin.render', this.state);
    if (typeof(FB) === 'undefined') {
      return (<div className="loading">Loading Facebook auth form</div>);
    }
    /*
    console.log('calling timeout to reparse');
    setTimeout(() => {
      console.log('re-parse running');
      FB.XFBML.parse(document.getElementById('fb-login-div'));
      FB.XFBML.parse();
    }, 1000);
    console.log('login form, status=' + this.state.login.status);
    */
    const { userId, name, profilePicUrl } = this.state;
    
    if (!userId) {
      //return (<div id="fb-login-div" style={{ minHeight: '200px' }} className="red-border" data-max-rows="1" data-size="large" data-show-faces="true" data-auto-logout-link="true"></div>);
      //console.log('login form for appID=' + FB_APP_ID);
      return (
        <div className="fb-login-parent fill-area">
        <FacebookLogin
          appId={FB_APP_ID}
          autoLoad={true}
          fields="name,email,picture"
          callback={fbLoginCallback} />
        </div>
      );
    }
    
    return (
      <div>
        Logged in as ID {userId}<br/>
        with name {name || 'Name unknown'}
      </div>
    );
  }
}
