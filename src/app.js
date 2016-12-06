import React from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import Dispatcher from './dispatcher/AppDispatcher.js';
import { IMAGE_CHANGED, IMAGES_LOADED } from './constants/FFConstants.js';
import FFActions from './actions/FFActions.js';

console.log('dispatcher is');
console.log(Dispatcher);
console.log(IMAGE_CHANGED);
console.log(IMAGES_LOADED);

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

  clickHandler(arg) {
    console.log('FFTable click handler with ' + arg);
    console.log(arg);
  }

  keyPressHandler(arg) {
    console.log('FFTable key pressed');
    console.log(arg);
  }
  
  render() {
    if (!this.state.images || this.state.images.length == 0) {
      return (<b>LOADING...</b>);
    }
    console.log('render: this.state is:');
    console.log(this.state);
    return (
        <div className="thumbs" onKeyPress={this.keyPressHandler}>
        {
          this.state.images.map((image) => {
            var key = 'ff-thumb-' + image.base;
            return <FFThumb key={key} image={image}/>;
          })
        }
      </div>
    );
  }
};

class FFThumb extends React.Component {

  constructor(props) {
    super(props);
  }

  clickHandler() {
    //document.getElementById('main-image').src = '/thumbs/' + this.props.image.full;
    FFActions.imageChanged(this.props.image);
  }
  
  render() {
    var path = '/thumbs/' + this.props.image.base + '_30x40_t.jpg';
    return <div className="thumb" key={this.props.image.base}>
      <img src={path} onClick={this.clickHandler.bind(this)}/>
      </div>;
  }
};

class FFMain extends React.Component {

  constructor(props) {
    super(props);
    Dispatcher.register(this.changeListener.bind(this));
  }

  changeListener(action) {
    console.log('FFMain.changeListener(' + action + ')');
    switch (action.actionType) {
    case IMAGE_CHANGED:
      this.setState({image: action.image });
      break;
    }
  }

  render() {
    console.log('FFMain render()');
    console.log(this);
    console.log(this.state);
    if (!this.state || !this.state.image) {
      return <h2>Select an image!</h2>;
    }
    var src = '/thumbs/' + this.state.image.full;
    return <img id="main-image" src={src}/>
  }
}
ReactDOM.render(<FFMain/>, document.getElementById('main'));
ReactDOM.render(<FFTable phrase="FF"/>, document.getElementById('thumbs'));
console.log('ff actions');
console.log(FFActions);
document.FFActions = FFActions;
