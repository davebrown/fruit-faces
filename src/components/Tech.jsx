import React from 'react';
import request from 'browser-request';

import { Link } from 'react-router';

class FFTech extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    var openBrace = '{';
    var closeBrace = '}';
    return (
      <div>
        <h1>Tech</h1>
        <p>Starting at the top of the stack and moving downward:</p>
        <h3>ReactJS</h3>
        <p>The front end is written with <a href="https://facebook.github.io/react/" target="_blank">ReactJS</a>, which has good docs and a great supporting ecosystem.</p>
        <p>I spent a fair bit of time grokking CSS - longer than I hoped, but not as long as I feared. Getting things right cross-browser is still a bit like the wild west, but still way better than 10 years ago, the last time I did any serious work on a web UX. I use standard media queries for responsive/mobile layouts, and <a href="https://github.com/ded/bowser" target="_blank">Bowser</a> for feature detection.</p>
        <p>Flex Box is a godsend; <a href="http://ianwremmel.github.io/flexbox-layouts/" target="_blank">this tutorial</a> and <a href="https://css-tricks.com/snippets/css/a-guide-to-flexbox/" target="_new"> this reference</a> are very helpful for the basics. After that, it's tweaking and detective work.</p>
        <h3>VictoryChart</h3>
        <h3>DropWizard</h3>
        <h3>JPA</h3>
        <p><a href="https://github.com/scottescue/dropwizard-entitymanager" target="_blank">Dropwizard EntityManager</a> lets you run JPA within Dropwizard, where config, and transaction management, etc, are native to Dropwizard.</p>
        <h3>Postgres</h3>
        <h3>Color-thief</h3>
        <p><a href="https://github.com/fengsp/color-thief-py">Color thief</a> Python library that finds dominant color in an image. I use this to figure out whether each image is on a blue plate or not, in order to make a low-res <a href="https://en.wikipedia.org/wiki/Photographic_mosaic" target="_blank">photo mosaic</a> of hearts.</p>
        <h3>AWS</h3>
        <h3>Amplitude</h3>
        <hr/>
        <h3>TO-DO</h3>
        <ul>
          <li>Auth via <code>{openBrace}Facebook | Google | Twitter{closeBrace}</code></li>
          <li>Upload <i>(currently images are ingested outside the app)</i></li>
          <li>Favorite voting</li>
          <li>ML for image categorization</li>
          <li>Use <a href="https://aws.amazon.com/rds/postgresql/" target="_blank">Amazon RDS for Postgres</a> instead of local</li>
          <li>Deploy via <a href="https://skyliner.io" target="_blank">Skyliner</a>.</li>
          <li>Logging, monitoring, alerting</li>
          <li>Version-controlled and automated database migrations</li>
          <li>At least a modicum of tests :-)</li>
        </ul>
      </div>
           );
  }
}

export default FFTech;
