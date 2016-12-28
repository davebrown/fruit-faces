import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';

const Children = React.Children;

class Dialog extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    /*console.debug('dialog children: ');
    console.debug(this.props.children);
    if (!this.props.children || this.props.children.length === 0) {
      return null;
    }
    console.debug('dialog children len: ' + Children.count(this.props.children));
    */
    var closeHandler = this.props.onClose || this.dialogCloseHandler.bind(this);
    return (<div className="column dialog expandable compressible">
            <button onClick={closeHandler}>X</button>
            {this.props.children}
            </div>
           );
  }

  dialogCloseHandler() {
    console.debug('DEBUG: no close handler specified for dialog');
  }
}

export default Dialog;
