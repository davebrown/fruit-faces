import React from 'react';
import { Link } from 'react-router';

class FFNav extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    return (<div className="nav">
        <div className="nav-item"><Link to='/about'>About</Link></div>
        <div className="nav-item"><Link to='/filters'>Filters</Link></div>
        <div className="nav-item"><Link to='/data'>Data</Link></div>
        <div className="nav-item">Slideshow</div>
        <div className="nav-item"><Link to='/tech'>Tech</Link></div>
        <div className="nav-item">Credits</div>
     </div>
           );
  }
}

export default FFNav;
