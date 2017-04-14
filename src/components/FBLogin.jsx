import React from 'react';
import { Link } from 'react-router';
import FacebookLogin from 'react-facebook-login';
import request from 'browser-request';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { FB_INITIALIZED, FB_AUTH_CHANGED } from '../constants/FFConstants.js';
import { AuthStore, FB_APP_ID } from '../stores/AuthStore.js';

export default class FBLogin extends React.Component {

  constructor(props) {
    super(props);
    var _fb = null;
    if (typeof(FB) != 'undefined')
      _fb = FB;
    this.state = {
      FB: _fb,
      login: null,
      fullName: null
    };
    this.dispatchHandler = this.dispatchHandler.bind(this);
    this.fbLoginCallback = this.fbLoginCallback.bind(this);
  }

  componentWillMount() {
    if (typeof(FB) !== 'undefined') {
      FB.getLoginStatus(this.fbLoginCallback);
    } else {
      this.dispatcherToken = Dispatcher.register(this.dispatchHandler);
      console.log('FBLogin componentWillMount - dispatch token is ' + this.dispatcherToken);
    }      
  }

  componentWillUnmount() {
    console.log('FBLogin - will unmount');
    if (this.dispatcherToken) {
      Dispatcher.unregister(this.dispatcherToken);
    }
    this.dipatcherToken = null;
  }

  dispatchHandler(action) {
    console.log('FBLogin.dispatchCallback', action, action.actionType == FB_INITIALIZED, typeof(action.actionType), typeof(FB_INITIALIZED), 'this==', this);
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
  fbLoginCallback(response) {
    console.log('fbLoginCallback()', response);
    this.setState({login: response});
    if (response.status === 'connected') {
      FB.api('/me', (rsp) => {
        if (!rsp || rsp.error) {
          console.warn('FB api error', rsp);
          return;
        }
        this.setState({fullName: rsp.name});
      });
    }
  }
  
  render() {
    console.log('FBLogin.render', this.state);
    if (!this.state.FB || !this.state.login) {
      return (<div className="loading">Loading Facebook auth form</div>);
    }
    console.log('calling timeout to reparse');
    setTimeout(() => {
      console.log('re-parse running');
      FB.XFBML.parse(document.getElementById('fb-login-div'));
      FB.XFBML.parse();
    }, 1000);
    console.log('login form, status=' + this.state.login.status);
    if (this.state.login.status !== 'connected' || this.state.login.userID) {
      //return (<div id="fb-login-div" style={{ minHeight: '200px' }} className="red-border" data-max-rows="1" data-size="large" data-show-faces="true" data-auto-logout-link="true"></div>);
      console.log('login form for appID=' + FB_APP_ID);
      return (
        <div className="fb-login-parent fill-area">
        <FacebookLogin
          appId={FB_APP_ID}
          autoLoad={true}
          callback={this.fbLoginCallback} />
        </div>
      );
    }
    return (
      <div>
        Logged in as ID {this.state.login.authResponse.userID}<br/>
        with name {this.state.fullName || 'Name unknown'}
      </div>
    );
  }
}
