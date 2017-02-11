import ClosedCircleIcon from 'react-icons/io/close-circled';

import React from 'react';
import { hashHistory } from 'react-router';
import FBBlock from './FBBlock.jsx';

const Children = React.Children;

class Dialog extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    
    if (!this.props.children || this.props.children.length === 0) {
      return null;
    }
    //console.debug('dialog children len: ' + Children.count(this.props.children));
    var closeHandler = this.props.onClose || this.dialogCloseHandler.bind(this);
    var hashLocation = hashHistory.getCurrentLocation();
    var dataHref = 'https://ff.moonspider.com/#' + hashLocation;
    var closeIconColor = '#000000';
    //var closeIconColor = '#ffffff';
    return (
      <div id="ff-dialog" className="column dialog expandable compressible scrollable">
        <ClosedCircleIcon className="close-icon" size={30} color={closeIconColor} onClick={closeHandler}/>
        <div className="dialog-content">
          {this.props.children}
        </div>
      </div>
    );
  }
  
  dialogCloseHandler() {
    hashHistory.push('/');
  }
}

export default Dialog;
