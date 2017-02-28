import React from 'react';
import request from 'browser-request';

import { Link } from 'react-router';

import FBBlock from './FBBlock.jsx';

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
        <p>The code&apos;s on <a href="https://github.com/davebrown/fruit-faces" target="_blank">GitHub</a>.</p>
        <p>The tech I played with to build this little app, starting at the top of the stack and moving downward:</p>
        <h3>ReactJS</h3>
        <p>The front end is written with <a href="https://facebook.github.io/react/" target="_blank">ReactJS</a>, which has good docs and a great supporting ecosystem.</p>
        <p>I spent a fair bit of time grokking CSS - longer than I hoped, but not as long as I feared. Getting things right cross-browser is still a bit like the wild west, but still way better than 10 years ago, the last time I did any serious work on a web UX. I use standard media queries for responsive/mobile layouts, and <a href="https://github.com/ded/bowser" target="_blank">Bowser</a> for feature detection.</p>
        <p>Flex Box is a godsend; <a href="http://ianwremmel.github.io/flexbox-layouts/" target="_blank">this tutorial</a> and <a href="https://css-tricks.com/snippets/css/a-guide-to-flexbox/" target="_new"> this reference</a> are very helpful for the basics. After that, it's tweaking and detective work.</p>
        <h3>VictoryChart</h3>
        <p>Still in alpha as of this writing, but <a href="http://formidable.com/open-source/victory/" target="_blank">Victory Charts</a> is great: well-thought out, responsive <a href="https://gitter.im/FormidableLabs/victory" target="_blank">community</a> and works well with a responsive HTML5 layout.</p>
        <h3>DropWizard</h3>
        <p>It's heretical for a former engineer on a successful <a href="http://www.oracle.com/technetwork/middleware/weblogic/overview/index-085209.html" target="_blank">application server</a> to say, but I like a lightweight app container: it makes development easy, and affords me flexibility to run how I want in production. I ran a product and a couple side projects using embedded <a href="http://www.eclipse.org/jetty/" target="_blank">Jetty</a> in the 2008-2010 timeframe, and so I'm glad that this approach has been productized in the form of <a href="https://dropwizard.io/" target="_blank">DropWizard</a>. The docs have been complete and spot on, and a good community around it.</p>
        <p>
          I was a bit dismayed that running a java service as a daemon hadn't moved further in the ~6 years since I last tried to do so. I think it's in good shape for my needs now though, with <a href="https://github.com/kohsuke/akuma" target="_blank">Akuma</a> (when my <a href="https://github.com/kohsuke/akuma/pull/12" target="_blank">PR is merged.</a>
        </p>
        <h3>JPA</h3>
        <p><a href="https://github.com/scottescue/dropwizard-entitymanager" target="_blank">Dropwizard EntityManager</a> lets you run JPA within Dropwizard, where config, and transaction management, etc, are native to Dropwizard. I might re-think this, though.</p>
        <h3>Postgres</h3>
        <p>I was going to try a NoSQL database, and still might, but my data set is tiny. And honestly, <a href="http://www.postgresql.org/" target="_blank">Postgres</a> is comfortable, like an old shoe.</p>
        <h3>Color-thief</h3>
        <p><a href="https://github.com/fengsp/color-thief-py">Color thief</a> Python library that finds dominant color in an image. I use this to figure out whether each image is on a blue plate or not, in order to make a low-res <a href="https://en.wikipedia.org/wiki/Photographic_mosaic" target="_blank">photo mosaic</a> of hearts.</p>
        <h3>AWS</h3>
        <p>Already had an <a href="https://aws.amazon.com/" target="_blank">AWS account</a>, but curious to try <a href="https://cloud.google.com/compute/" target="_blank">GCE</a> for various reasons.</p>
        <h3>Amplitude</h3>
        <p>Some cool kid told me to use <a href="https://amplitude.com/home-a" target="_blank">Ampltiude</a> for basic event tracking. So far, so good.</p>
        <hr/>
        <h3>TO-DO</h3>
        <ul>
          <li>Auth via <code>{openBrace}Facebook | Google | Twitter{closeBrace}</code></li>
          <li>Upload <i>(currently images are ingested outside the app)</i></li>
          <li>Favorite voting</li>
          <li>Improve ML for image categorization - identify particular fruits</li>
          <li>Use <a href="https://aws.amazon.com/rds/postgresql/" target="_blank">Amazon RDS for Postgres</a> instead of local</li>
          <li>Produce, deploy Docker containers</li>
          <li>Deploy via <a href="https://skyliner.io" target="_blank">Skyliner</a>.</li>
          <li><span className="strike">Logging,</span> monitoring, alerting</li>
          <li><span className="strike">Version-controlled and automated database migrations</span></li>
          <li><span className="strike"><a href="https://letsencrypt.org/" target="_blank">Let&apos;s Encrypt</a> for TLS</span></li>
          <li>At least a modicum of tests :-)</li>
        </ul>
        <FBBlock like={false}/>
      </div>
           );
  }
}

export default FFTech;
