import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router';

class Dialog extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (<div className="column dialog expandable compressible">
            {this.props.children}
            </div>
           );
  }
}

export default Dialog;
