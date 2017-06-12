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
        <h2 className="text-center">Fruit Faces <br/> the app!</h2>
        <p className="text-center">
          <em>TL;DR:</em> Some guy made an app to collect &amp; show weird fruit sculptures for kids.
        </p>
        <div className="flex-container flex-wrap home-thumbs">
          <Link to="/1/IMG_4075">
            <img src="https://ff.moonspider.com/thumbs/1/IMG_4075_240x320_t.jpg"/>
          </Link>
          <Link to="/1/IMG_3462">
            <img src="https://ff.moonspider.com/thumbs/1/IMG_3462_240x320_t.jpg"/>
          </Link>
          <Link to="/1/IMG_5878">
            <img src="https://ff.moonspider.com/thumbs/1/IMG_5878_240x320_t.jpg"/>
          </Link>
          <Link to="/1/IMG_5194">
            <img src="https://ff.moonspider.com/thumbs/1/IMG_5194_240x320_t.jpg"/>
          </Link>
          <Link to="/1/IMG_4939">
            <img src="https://ff.moonspider.com/thumbs/1/IMG_4939_240x320_t.jpg"/>
          </Link>
          <Link to="/1/IMG_4100">
            <img src="https://ff.moonspider.com/thumbs/1/IMG_4100_240x320_t.jpg"/>
          </Link>
        </div>
        <p>
          See the <Link to="/about">about page</Link> for more info.
        </p>
        <p>
          Be sure to check out the low-res <Link to="/mosaic">photo mosaic</Link> before you go!
        </p>
      </div>
    );
  }
}
