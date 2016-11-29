import React from 'react';
import ReactDOM from 'react-dom';

class HelloWorld extends React.Component {
    render() {
        return <div><p>Hello from {this.props.phrase}!</p></div>;
    }
}

ReactDOM.render(<HelloWorld phrase="FF"/>, document.getElementById('main'));
