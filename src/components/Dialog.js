import React from 'react';
import { hashHistory } from 'react-router';
import FBBlock from './FBBlock.jsx';

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
    var dataHref = 'https://ff.moonspider.com/#' + hashLocation;
    return (
      <div className="column dialog expandable compressible scrollable">
        <span className="back-button" onClick={closeHandler}>⬅</span>
        {this.props.children}
      </div>
    );
  }
  
  dialogCloseHandler() {
    hashHistory.push('/');
  }
}

export default Dialog;
