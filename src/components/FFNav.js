import React from 'react';
import { Link } from 'react-router';

class FFNav extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    var slideShow = (<div className="nav-item">Slideshow</div>);
    slideShow = '';

    return (<div className="nav">
        <div className="nav-item"><Link to='/about'>About</Link></div>
            <div className="nav-item"><Link to='/filters'>Filters</Link></div>
            {slideShow}
        <div className="nav-item"><Link to='/data'>Data</Link></div>
        <div className="nav-item"><Link to='/tech'>Tech</Link></div>
        <div className="nav-item"><Link to='/credits'>Credits</Link></div>
     </div>
           );
  }
}

export default FFNav;
