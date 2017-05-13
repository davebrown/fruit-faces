import React from 'react';
import { Link } from 'react-router';
import FacebookLogin from 'react-facebook-login';
import request from 'browser-request';
import bowser from 'bowser';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { FB_INITIALIZED, FB_AUTH_CHANGED } from '../constants/FFConstants.js';
import { authStore, FB_APP_ID, fbLoginCallback } from '../stores/AuthStore.js';
import { REDIRECT_URI } from '../util/Util.js';

export default class FBLogin extends React.Component {

  constructor(props) {
    super(props);
    this.authChanged = this.authChanged.bind(this);
  }

  componentWillMount() {
    authStore.addChangeListener(this.authChanged);
    this.authChanged();
  }

  componentWillUnmount() {
    //console.log('FBLogin - will unmount');
    authStore.removeChangeListener(this.authChanged);
  }

  authChanged() {
    //console.log('FBLogin.authChanged');
    this.setState({
      userId: authStore.getUserID(),
      name: authStore.getFullName(),
      profilePicUrl: authStore.getProfilePicUrl()
    });
  }

  doLogout() {
    FB.logout();
  }
  
  render() {
    console.log('FBLogin.render', this.state);
    if (typeof(FB) === 'undefined') {
      return (<div className="loading">Loading Facebook auth form</div>);
    }
    const { userId, name, profilePicUrl } = this.state;
    
    if (!userId) {
      return (
        <div className="fb-login-parent fill-area">
          <FacebookLogin
            appId={FB_APP_ID}
            autoLoad={true}
            fields="name,email,picture"
            isMobile={bowser.mobile}
            redirectUri={ REDIRECT_URI }
            callback={fbLoginCallback} />
        </div>
      );
    }

    const profileTag = profilePicUrl ? (<img src={profilePicUrl}/>) : '';
    
    return (
      <div>
        Logged in as {name || 'Name unknown'} &nbsp; {profileTag}<br/>
      <button className="ff-button" onClick={this.doLogout}>Logout</button>
      </div>
    );
  }
}
