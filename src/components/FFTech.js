import React from 'react';
import request from 'browser-request';

import { Link } from 'react-router';

class FFTech extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (<div className="data">
            <h2>Tech</h2>
            <p>Lorem ipsum. Interesting tech.</p>
            </div>
           );
  }
}

export default FFTech;
