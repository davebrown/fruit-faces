import React from 'react';
import { Link } from 'react-router';
import FBBlock from './FBBlock.jsx';

export default class About extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h1>About</h1>
        <h2>tl;dr</h2>
        <p>
          I have all these fruit face pics from preparing breakfast for my kids. I wanted to make an app to view them, and learn some new <Link to="/tech">tech</Link> along the way.
        </p>
        <p>
          <b>&lt;--</b> click on a thumbnail over there to see one up close. Or use your left/right arrows to navigate by keyboard, or swipe left/right on mobile. The possibilities are nearly endless!
        </p>
        <h2>Why</h2>
        <p>
          When my oldest daughter was a toddler, in an effort to make a nutritious breakfast appealing and fun*, I started making weird little sculptures and faces out of whatever fruit was on hand. As it happens in this age of mobile devices, I eventually started taking pictures of these "fruit faces".
        </p>
        <p>As it also happens in this age of easy and ubiquitous mobile photography, after a while I had a bunch of these fruit face pics. Hundreds. I kept thinking "I should... do... <i>something</i>... with these." I'd get a vague vision of this or that detail of how I'd like to look at them all together - in particular, I kept envisioning a <a href="https://en.wikipedia.org/wiki/Photographic_mosaic" target="_blank">photo mosaic</a> to form something interesting, but then the rest of life kept happening and demanding attention, and the pics kept accumulating.</p>
        <h2>When</h2>
        <p>I started making these little faces circa 2013, and snapping photos of them in 2014. In December, 2016 I quit my job to take some time and figure out what to do next. I had been managing software engineers, and while that is satisfying in a lot of ways, I also started to miss doing hands-on software development myself.</p>
        
        <p><Link to="/images/IMG_2128">Each picture</Link> shows the date and time of when it was taken, and the <Link to="/data">data page</Link> has charts for the data nerds: monthly counts, time of day, day of week.</p>
        <h2>What and How</h2>
        <p>The stuff I've played with so far is described on the <Link to="/tech">Tech page</Link>.</p>
        
        <h2>Credits</h2>
        <p>Props to <a href="https://github.com/ianwremmel">Ian Remmel</a> for his JS advice and his
          straightforward <a href="http://ianwremmel.github.io/flexbox-layouts/">tutorial on FlexBox layouts.</a></p>
        <p>Thanks to <a href="http://aliciachastain.com/">Alica Chastain</a> for her design advice.</p>
        <p>Hugs to <a href="http://maisybrown.com/">Maisy</a> for eating all the fruit. I ❤ you!</p>

        <hr width="50%"/>
        <p className="footnote"> * On this count, getting my kid to eat fruit: the experiment is a success. I think she would eat her weight in assorted fruit if she were left to her own devices.</p>
        <FBBlock/>
      </div>
    );
  }
}
