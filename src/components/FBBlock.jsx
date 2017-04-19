import React, { PropTypes } from 'react';

var fbTimer = null;

export default class FBBlock extends React.Component {

  static propTypes = {
    like: PropTypes.bool,
    comments: PropTypes.bool
  };

  static defaultProps = {
    like: true,
    comments: true
  };
  
  constructor(props) {
    super(props);
  }

  render() {
    const { like, comments } = this.props;
    const dataHref = window.location.href;
    var likeDiv = like ? (<div className="fb-like" data-share="true" data-width="450" data-show-faces="true"></div>): null;
    var commentsDiv = comments ? (<div className="fb-comments" data-href={dataHref} data-width="100%" data-numposts="5"></div>): null;
    if (fbTimer) {
      clearTimeout(fbTimer);
      fbTimer = 0;
    }
    var fbParseFunc = () => {
      fbTimer = null;
      //console.log('timer re-parse woke up on ' + dataHref);
      // occasionally see 'FB not defined' on first load. If not there yet, just defer
      if (typeof(FB) === 'undefined') {
        //console.warn('FB not loaded, deferring');
        fbTimer = setTimeout(fbParseFunc, 1000);
        return;
      }
      // FIXME: figure out a way to check that this element exists, without scanning the whole document
      var fbIframes = document.getElementsByClassName('fb_iframe_widget');
      // ask FB to decorate the page iff its 'fb_iframe_widget' isn't on the page already
      // otherwise, there's a noticeable and annoying flicker
      if (!fbIframes || fbIframes.length === 0) {
        FB.XFBML.parse(document.getElementById('ff-fb-block'));
      } else {
        // nothing to do
      }
      fbTimer = 0;
    };
    if (fbTimer) {
      clearTimeout(fbTimer);
    }
    fbTimer = setTimeout(fbParseFunc, 300);
    return !likeDiv && !commentsDiv ? (<span className="disabled loading footnote">facebook form</span>):
           (
             <div id="ff-fb-block">
               {likeDiv}
               {commentsDiv}
             </div>
           );
    
  }

}
