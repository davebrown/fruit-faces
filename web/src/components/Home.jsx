import React from 'react';
import { Link } from 'react-router-dom';
import FBBlock from './FBBlock.jsx';

export default class Home extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Fruit Faces - the app!</h2>
        <h3>TL;DR</h3>
        <p>
          Some guy made an app to collect &amp; show weird fruit sculptures for his kids.
        </p>
        
      </div>
    );
  }
}
