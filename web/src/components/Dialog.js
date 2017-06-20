import React from 'react';
import { history } from '../util/Util.js';
import { Icon } from 'react-fa';

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
    var closeHandler = this.props.onClose || this.dialogCloseHandler.bind(this);
    var closeIcon = (<Icon name="times-circle-o" className="close-icon" onClick={closeHandler}/>);
    return (
      <div id="ff-dialog" className="flex-column ff-dialog">
        {closeIcon}
        <div className="dialog-content">
          {this.props.children}
        </div>
      </div>
    );
  }
  
  dialogCloseHandler() {
    history.replace('/');
  }
}

export default Dialog;
