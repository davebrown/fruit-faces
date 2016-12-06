import React from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import Dispatcher from './AppDispatcher.js';

function secondClickHandler(arg) {
  console.log("SECOND click handler: " + arg);
  document.getElementById('main-image').src = '/thumbs/' + arg;
}

class FFTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = { images: [] };
  }
  /*
  getInitialState() {
    return {
      images: []
    };
  }*/

  componentWillMount() {
    console.log('component will mount');
    this.loadImageDefs();
  }

  loadImageDefs() {
    request('images.json', function(er, response, bodyString) {
      if (er)
        throw er;
      var body = JSON.parse(bodyString);
      console.log("loaded " + body.length + " image(s)");
      /*
      for (var i = 0; i < body.length; i++) {
        console.log(body[i].base);
      }*/
      this.setState( { images: body } );
    }.bind(this));
  }

  keyPressHandler(arg) {
    console.log('key pressed');
    console.log(arg);
  }
  
  render() {
/*    return <div><p>
      <img id="test-img" src="thumbs/IMG_4588_60x80_t.jpg" onClick={secondClickHandler}/><br/>
      Hello from {this.props.phrase}!<br/>
      <img id="main-image" width="100%" alt="fruit face"/></p></div>;
*/
    if (!this.state.images || this.state.images.length == 0) {
      return (<b>LOADING...</b>);
    }
    console.log('render: this.state is:');
    console.log(this.state);
    return (
        <div className="thumbs" onKeyPress={this.keyPressHandler}>
        {
          this.state.images.map((image) => {
            var path = '/thumbs/' + image.base + '_30x40_t.jpg';
            return <div className="thumb" key={image.base}>
              <img src={path} onClick={secondClickHandler.bind(this, image.full)}/>
              </div>;
          })
        }
      </div>
    );
  }
};
ReactDOM.render(<FFTable phrase="FF"/>, document.getElementById('thumbs'));
