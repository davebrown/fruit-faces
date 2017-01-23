import React, { PropTypes } from 'react';

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
    var dataHref = window.location.href;
    var likeDiv = like ? (<div className="fb-like" data-share="true" data-width="450" data-show-faces="true"></div>): null;
    var commentsDiv = comments ? (<div className="fb-comments" data-href={dataHref} data-width="100%" data-numposts="5"></div>): null;
    return !likeDiv && !commentsDiv ? null:
           (
             <div>
               <b>{dataHref}</b><br/>
               {likeDiv}
               {commentsDiv}
             </div>
           );
    
  }

}
