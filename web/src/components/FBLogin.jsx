import React from 'react';
import { Link } from 'react-router-dom';
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
    this.mounted = true;
    authStore.addChangeListener(this.authChanged);
    this.authChanged();
  }

  componentWillUnmount() {
    authStore.removeChangeListener(this.authChanged);
    this.mounted = false;
  }

  authChanged() {
    if (this.mounted) {
      this.setState({
        userId: authStore.getUserID(),
        name: authStore.getFullName(),
        profilePicUrl: authStore.getProfilePicUrl()
      });
    }
  }

  doLogout() {
    FB.logout();
  }
  
  render() {
    const scope = this.props.scope || '';
    if (this.props.renderLink) {
      const containerStyle = {
        display: 'block',
        outline: 'none'
      };
      //const scope = 'publish_actions';
      return (
        <FacebookLogin
          appId={FB_APP_ID}
          autoLoad={true}
          fields="name,email,picture"
          isMobile={bowser.mobile}
          scope={scope}
          redirectUri={ REDIRECT_URI }
          callback={fbLoginCallback}
          tag="a"
          cssClass="bm-menu menu-item"
          containerStyle={containerStyle}
          textButton={this.props.authText || 'Login...'}
          typeButton="link"
        />
      );
      
    }
    
    //console.log('FBLogin.render', this.state);
    if (typeof(FB) === 'undefined') {
      return (<div><span>Loading Facebook form...</span><span className="loading">loading</span></div>);
    }
    const { userId, name, profilePicUrl } = this.state;
    
    return (
      <FacebookLogin
        appId={FB_APP_ID}
        autoLoad={true}
        fields="name,email,picture"
        isMobile={bowser.mobile}
        redirectUri={ REDIRECT_URI }
        cssClass="btn btn-sm"
        scope={scope}
        textButton={this.props.authText || 'Login...'}
        callback={fbLoginCallback} />
    );

  }
}
