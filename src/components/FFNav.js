import React from 'react';
import { Link } from 'react-router';
import bowser from 'bowser';

class FFNav extends React.Component {
  constructor(props) {
    super(props);
  }

  onClick(e) {
    var to = e.target.hash;
    if (to.length > 0 && to[0] === '#')
      to = to.substring(1);
    
    amplitude.logEvent('NAV_LINK', { to: to || 'unknown' });
  }
  
  render() {
    var slideShow = (<div className="nav-item">Slideshow</div>);
    slideShow = '';

    var aboutRef = bowser.mobile ? '/about' : '/';
    return (
      <div className="nav">
        <div className="nav-item"><Link to={aboutRef} onClick={this.onClick}>About</Link></div>
        <div className="nav-item"><Link to='/filters' onClick={this.onClick}>Filters</Link></div>
        {slideShow}
        <div className="nav-item"><Link to='/data' onClick={this.onClick}>Data</Link></div>
        <div className="nav-item"><Link to='/tech' onClick={this.onClick}>Tech</Link></div>
      </div>
           );
  }
}

export default FFNav;
