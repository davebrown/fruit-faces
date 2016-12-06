import React from 'react';
import ReactDOM from 'react-dom';
import request from 'browser-request';
import Dispatcher from './AppDispatcher.js';

console.log('dispatcher is:');
console.log(Dispatcher);
export function secondClickHandler(arg) {
  console.log("SECOND click handler: " + arg);
  document.getElementById('main-image').src = '/thumbs/' + arg;
  if (arg && arg.target)
    console.log('target: ' + arg.target.src);
  else
    console.log('no target for event? ' + arg);
  
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
      <div className="thumbs">
        {
          this.state.images.map((image) => {
            var path = '/thumbs/' + image.base + '_20x27_t.jpg';
            return <div className="thumb" key={image.base}><img src={path} onClick={secondClickHandler.bind(this, image.full)}/></div>
          })
        }
      </div>
    );
  }
};

/*  
request('images.json', function(er, response, body) {
  if (er)
    throw er;
  console.log("I got: " + body);
});
/*var images = document.getElementsByTagName('img');
for (var i = 0; i < images.length; i++) {
  var src = images[i]['src'];
  var click = images[i]['onClick'];
  console.log('image: ' + src + ' click=' + click);
  //images[i].onClick = 'secondClickHandler(\'' + src + '\');';
  images[i].addEventListener(click, function(event) {
    console.log('click on ' + src);
  });
}*/
ReactDOM.render(<FFTable phrase="FF"/>, document.getElementById('thumbs'));
