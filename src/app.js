import React from 'react';
import ReactDOM from 'react-dom';

class HelloWorld extends React.Component {
    render() {
        return <div><p>Hello from {this.props.phrase}!<br/><img id="main-image" width="100%" alt="fruit face"/></p></div>;
    }
}

function secondClickHandler(arg) {
  console.log("SECOND click handler: " + arg);
}
ReactDOM.render(<HelloWorld phrase="FF"/>, document.getElementById('main'));
secondClickHandler('howya doing?!?');
