import React from 'react';
import { Link } from 'react-router-dom';
import FBBlock from './FBBlock.jsx';

class HT extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const base = this.props.base;
    const to = "/images/1/" + base;
    const img = "https://ff.moonspider.com/thumbs/1/" + base + "_240x320_t.jpg";
    return (
      <Link to={to}>
        <img src={img} style={{ width: '120px', height: '160px', margin: '2px' }}/>
      </Link>
    );
  }
}

export default class Home extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="flex-column ff-home">
        <h2 className="text-center">Fruit Faces <br/> the app!</h2>
        <p className="text-center">
          <em>TL;DR:</em> Some guy made an app to collect &amp; show weird fruit sculptures for kids.
        </p>
        <div className="flex-container flex-wrap home-thumbs">
          <HT base="IMG_4075"/>
          <HT base="IMG_3462"/>
          <HT base="IMG_5878"/>
          <HT base="IMG_5194"/>
          <HT base="IMG_4939"/>
          <HT base="IMG_4100"/>
          <HT base="IMG_4169"/>
          <HT base="IMG_3834"/>
          <HT base="IMG_4489"/>
          <HT base="IMG_4214"/>
          <HT base="IMG_4443"/>
          <HT base="IMG_5937"/>
          <HT base="IMG_5893"/>
          <HT base="IMG_3650"/>
          <HT base="IMG_2069"/>
          <HT base="IMG_2121"/>
          <HT base="IMG_3862"/>
          <HT base="IMG_3458"/>
        </div>
        <p>
          See the <Link to="/about">about page</Link> for more info.
        </p>
        <p>
          Be sure to check out the low-res <Link to="/mosaic">photo mosaic</Link> before you go!
        </p>
        <div className="footer-padding"></div>
      </div>
    );
  }
}
