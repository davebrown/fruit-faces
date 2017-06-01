import React from 'react';
import { Link } from 'react-router';
import bowser from 'bowser';

import { FB_AUTH_CHANGED } from '../constants/FFConstants.js';
import { authStore } from '../stores/AuthStore.js';
import { amplitude } from '../util/Util.js';

class FFNav extends React.Component {

  constructor(props) {
    super(props);
    this.authChanged = this.authChanged.bind(this);
  }

  componentWillMount() {
    authStore.addChangeListener(this.authChanged);
    this.authChanged();
  }

  componentWillUnmount() {
    authStore.removeChangeListener(this.authChanged);
  }
  
  authChanged() {
    //console.log('FFNav.authChanged()->' + authStore.getUserID());
    this.setState({
      userId: authStore.getUserID(),
      name: authStore.getFullName(),
      profilePicUrl: authStore.getProfilePicUrl()
    });
  }    
      
  onClick(e) {
    var to = e.target.hash;
    if (to.length > 0 && to[0] === '#')
      to = to.substring(1);
    
    amplitude.logEvent('NAV_LINK', { to: to || 'unknown' });
  }
  
  render() {
    const { userId, name, profilePicUrl } = this.state;
    var slideShow = (<div className="nav-item">Slideshow</div>);
    slideShow = '';

    var aboutRef = bowser.mobile ? '/about' : '/';
    
    var authText = userId != null ? "Logout": "Login...";
    const profileTag = profilePicUrl ? (<img src={profilePicUrl}/>) : '';
    return (
      <div className="nav">
        {profileTag}
        <div className="nav-item"><Link to="/login" onClick={this.onClick}>{authText}</Link></div>
        <div className="nav-item"><Link to={aboutRef} onClick={this.onClick}>About</Link></div>
        <div className="nav-item"><Link to='/filters' onClick={this.onClick}>Filters</Link></div>
        <div className="nav-item"><Link to='/upload' onClick={this.onClick}>Upload</Link></div>
        {slideShow}
        <div className="nav-item"><Link to='/data' onClick={this.onClick}>Data</Link></div>
        <div className="nav-item"><Link to='/tech' onClick={this.onClick}>Tech</Link></div>
      </div>
    );
  }
}

export default FFNav;
