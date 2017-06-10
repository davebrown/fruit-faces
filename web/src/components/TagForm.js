import React, { PropTypes } from 'react';

import ImageStore from '../stores/ImageStore.js';
import FFCheck from './FFCheck.js';
import { API_BASE_URL, reportError, errToString } from '../util/Util.js';
import FFActions from '../actions/FFActions.js';
import { authStore } from '../stores/AuthStore.js';

var FRUITS = [ 'apple', 'bacon', 'banana', 'blackberry', 'blueberry', 'cantaloupe', 'cereal', 'cheese', 'clementine',
               'googly eyes', 'grape', 'honeydew', 'kiwi', 'mango',
               'peach', 'pear', 'pineapple', 'plum', 'raspberry', 'strawberry', 'try harder Dad!', 'watermelon' ];

//FRUITS = [ 'strawberry', 'raspberry', 'apple' ]

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
  }

  componentWillMount() {
    this.checkBoxes = new Set();
    this.setState({error: null});
  }

  render() {
    var image = ImageStore.getSelectedImage();
    var className = "flex-container flex-column tag-form " + (this.props.className || '');
    return (
      <div className={className} onClick={(e) => e.stopPropagation() }>
        <h4 className="text-center">plates</h4>
        <div className="flex-container flex-wrap inline-grid">
        {
          TAGS.map((tag) => {
            var key = 'ff-checkbox-' + tag;
            return <FFCheck key={key} image={image} fruit={tag}/>;
          })
        }
        </div>
        <h4 className="text-center">fruits</h4>
        <div className="flex-container flex-wrap inline-grid">
          {
            FRUITS.map((tag) => {
              var key = 'ff-checkbox-' + tag;
              return <FFCheck key={key} image={image} fruit={tag}/>;
            })
          }
        </div>
      </div>
    );
  }
}

export default TagForm;
