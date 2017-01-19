import React from 'react';
import ReactDOM from 'react-dom';
import { hashHistory } from 'react-router';

const Children = React.Children;

class Dialog extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    
    //console.debug('dialog children: ');
    //console.debug(this.props.children);
    if (!this.props.children || this.props.children.length === 0) {
      return null;
    }
    //console.debug('dialog children len: ' + Children.count(this.props.children));
    var closeHandler = this.props.onClose || this.dialogCloseHandler.bind(this);
    var hashLocation = hashHistory.getCurrentLocation();
    var dataHref = 'http://ff.moonspider.com/#' + hashLocation;
    return (<div className="column dialog expandable compressible scrollable">
            <span className="back-button" onClick={closeHandler}>⬅</span>
            {this.props.children}
            <div
              className="fb-like"
              data-share="true"
              data-width="450"
              data-show-faces="true">
            </div>
            <hr/>
            <div className="fb-comments" data-href={dataHref} data-width="100%" data-numposts="5"></div>
           </div>
           );
  }

  dialogCloseHandler() {
    console.debug('DEBUG: no close handler specified for dialog');
    hashHistory.push('/');
  }
}

export default Dialog;
