import React from 'react';
import { Link } from 'react-router';
import bowser from 'bowser';

class FFNav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var slideShow = (<div className="nav-item">Slideshow</div>);
    slideShow = '';

    var aboutRef = bowser.mobile ? '/about' : '/';
    return (
      <div className="nav">
        <div className="nav-item"><Link to={aboutRef}>About</Link></div>
        <div className="nav-item"><Link to='/filters'>Filters</Link></div>
        {slideShow}
        <div className="nav-item"><Link to='/data'>Data</Link></div>
        <div className="nav-item"><Link to='/tech'>Tech</Link></div>
      </div>
           );
  }
}

export default FFNav;
