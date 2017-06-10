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
        <h4>TL;DR</h4>
        <p>
          Some guy made an app to collect &amp; show weird fruit sculptures for kids.
        </p>
        <p style={{ margin: '0 auto'}}>
          <img src="https://ff.moonspider.com/thumbs/1/IMG_4075.jpg" style={{ width: '120px', height: '160px', margin: '10px'}}/>
          <img src="https://ff.moonspider.com/thumbs/1/IMG_3462.jpg" style={{ width: '120px', height: '160px', margin: '10px'}}/>
          <img src="https://ff.moonspider.com/thumbs/1/IMG_5878_480x640_t.jpg" style={{ width: '120px', height: '160px', margin: '10px'}}/>
          <img src="https://ff.moonspider.com/thumbs/1/IMG_5194.jpg" style={{ width: '120px', height: '160px', margin: '10px'}}/>
          <img src="https://ff.moonspider.com/thumbs/1/IMG_4939.jpg" style={{ width: '120px', height: '160px', margin: '10px'}}/>
          <img src="https://ff.moonspider.com/thumbs/1/IMG_4100.jpg" style={{ width: '120px', height: '160px', margin: '10px'}}/>
        </p>
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
