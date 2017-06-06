import React from 'react';
import { slide as Menu } from 'react-burger-menu';
import { Link } from 'react-router-dom';
import bowser from 'bowser';

import { FB_AUTH_CHANGED } from '../constants/FFConstants.js';
import FBLogin from './FBLogin.jsx';
import { authStore } from '../stores/AuthStore.js';
import { amplitude } from '../util/Util.js';

export default class SideMenu extends React.Component {
  constructor(props) {
    super(props);
    this.authChanged = this.authChanged.bind(this);
    this.linkClicked = this.linkClicked.bind(this);
    this.doLogout = this.doLogout.bind(this);
  }

  linkClicked(e) {
    this.setState({ open: false });
  }

  authChanged() {
    //console.log('SideMenu.authChanged()->' + authStore.getUserID());
    this.setState({
      userId: authStore.getUserID(),
      name: authStore.getFullName(),
      profilePicUrl: authStore.getProfilePicUrl()
    });
  }    

  componentWillMount() {
    authStore.addChangeListener(this.authChanged);
    this.setState({ open: false });
    this.authChanged();
  }

  componentWillUnmount() {
    authStore.removeChangeListener(this.authChanged);
  }

  doLogout(e) {
    authStore.logout();
    FB.logout();
    this.setState({open: false});
    e.stopPropagation();
  }
  
  render() {
    const { open } = this.state;
    const { userId, name, profilePicUrl } = this.state;
    var slideShow = (<div className="nav-item">Slideshow</div>);
    slideShow = '';

    var aboutRef = bowser.mobile ? '/about' : '/';
    
    var authText = userId != null ? "Logout": "Login...";
    const authLink = userId != null ?
                     (<a onClick={this.doLogout}>Logout</a>) :
                     (<FBLogin renderLink={true} text="Login..."/>);
    const profileTag = profilePicUrl ? (<img className="headshot menu-item" src={profilePicUrl}/>) : '';
    //console.log('SideMenu.render(): userId=' + userId);
    return (
      <div className="right">
        <Menu right={true} isOpen={open} outerContainerId={"container"} pageWrapId="main" width={ '200px' }>
          {profileTag}
          {authLink}
          <Link className="menu-item" to={aboutRef} onClick={this.linkClicked}>About</Link>
          <Link className="menu-item" to='/filters' onClick={this.linkClicked}>Filters</Link>
          <Link className="menu-item" to='/upload' onClick={this.linkClicked}>Upload</Link>
          {slideShow}
          <Link className="menu-item" to='/data' onClick={this.linkClicked}>Data</Link>
          <Link className="menu-item" to='/tech' onClick={this.linkClicked}>Tech</Link>
        </Menu>
      </div>
    );

  }
}
