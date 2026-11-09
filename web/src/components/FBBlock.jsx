import React from 'react';
import PropTypes from 'prop-types';

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
    this.block = React.createRef();
  }

  componentDidMount() {
    this.scheduleParse();
  }

  componentDidUpdate() {
    this.scheduleParse();
  }

  componentWillUnmount() {
    clearTimeout(this.fbTimer);
  }

  scheduleParse() {
    clearTimeout(this.fbTimer);
    this.fbTimer = setTimeout(() => {
      if (!window.FB?.XFBML) {
        this.scheduleParse();
      } else if (this.block.current && !this.block.current.querySelector('.fb_iframe_widget')) {
        window.FB.XFBML.parse(this.block.current);
      }
    }, 300);
  }

  render() {
    const { like, comments } = this.props;
    const dataHref = window.location.href;
    const likeDiv = like ? (<div className="fb-like" data-share="true" data-width="450" data-show-faces="true"></div>): null;
    const commentsDiv = comments ? (<div className="fb-comments" data-href={dataHref} data-width="100%" data-numposts="5"></div>): null;
    return (!likeDiv && !commentsDiv) ? (<span className="disabled loading footnote">facebook form</span>):
           (
             <div id="ff-fb-block" ref={this.block} className={this.props.className || ''}>
               {likeDiv}
               {commentsDiv}
               <div className="footer-padding"></div>
             </div>
           );
    
  }

}
