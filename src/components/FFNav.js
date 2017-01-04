import React from 'react';
import { Link } from 'react-router';

class FFNav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<div className="nav fixed">
      <ul>
        <li><Link to='/about'>About</Link></li>
        <li><Link to='/filters'>Filters</Link></li>
        <li><Link to='/data'>Data</Link></li>
        <li>Slideshow</li>
        <li><Link to='/tech'>Tech</Link></li>
        <li>Credits</li>
      </ul>
     </div>
           );
    
  }
}

export default FFNav;
