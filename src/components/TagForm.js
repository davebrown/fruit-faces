import React, { PropTypes } from 'react';
import request from 'browser-request';

import ImageStore from '../stores/ImageStore.js';
import FFCheck from './FFCheck.js';
import { API_BASE_URL, reportError, errToString } from '../util/Util.js';
import FFActions from '../actions/FFActions.js';
import { authStore } from '../stores/AuthStore.js';

var FRUITS = [ 'apple', 'bacon', 'banana', 'blackberry', 'blueberry', 'cantaloupe', 'cereal', 'cheese', 'clementine',
               'googly eyes', 'grape', 'honeydew', 'kiwi', 'mango',
               'peach', 'pear', 'pineapple', 'plum', 'raspberry', 'strawberry', 'try harder Dad!', 'watermelon' ];

FRUITS = [ 'strawberry', 'raspberry', 'apple' ]

var TAGS = [ 'blue', 'gray', 'white' ];

//TAGS = TAGS.concat(FRUITS);

class TagForm extends React.Component {

  static propTypes = {
    image: PropTypes.object
  };

  static defaultProps = {
    image: null
  };
  
  constructor(props) {
    super(props);
    this.deleteClicked = this.deleteClicked.bind(this);
  }

  componentWillMount() {
    this.checkBoxes = new Set();
    this.setState({error: null});
  }

  deleteClicked() {
    const image = this.props.image;
    var next = ImageStore.getNextImage();
    if (next && next.base === image.base) {
      // special case the last image
      next = null;
    }
    console.log('delete image: ' + image.base);
    request({
      method: 'DELETE',
      url: API_BASE_URL + '/api/v1/images' + image.root + '/' + image.base,
      headers: {
        'X-FF-Auth': authStore.getAccessToken()
      }
    }, (er, response, bodyString) => {
      if (er) {
        console.log('delete image problem: ' + er);
        reportError(er, 'problem deleting image');
        this.setState({ error: er });
        return;
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        var errObj = JSON.parse(bodyString);
        reportError(errObj, 'problem deleting image');
        this.setState({ error: errObj });
      } else {
        console.log('delete image OK? code=' + response.statusCode);
        FFActions.imageDeleted(image, next);
      }
    });
  }
  
  render() {
    const error = this.state.error;
    if (error) {
      setTimeout(function() {
        this.setState({error: null});
      }.bind(this), 3000);
      return (<div className="error">{errToString(error)}</div>);
    }
    /* FIXME: race condition on initial load, selected image still null, need to handle async properties */
    var image = ImageStore.getSelectedImage();
    var i = 0;
    return (
      <div id="tag-form" className="container tag-form column">
        <button className="ff-button" onClick={this.deleteClicked}>Delete Image</button>
        <table><tbody><tr>
          {
            FRUITS.map((fruit) => {
              var key = 'ff-checkbox-' + fruit;
              var td =  (<td key={key}><FFCheck image={image} fruit={fruit}/></td>);
              //if (++i % 5 == 0) return (<tr>{td}</tr>);
              return td;
            })
          }
        </tr>
        <tr>  
          {
            TAGS.map((tag) => {
              var key = 'ff-checkbox-' + tag;
              return <td key={key}><FFCheck image={image} fruit={tag}/></td>
            })
          }
        </tr></tbody></table>
      </div>
    );
  }
}

export default TagForm;
