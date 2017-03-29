import React, { PropTypes } from 'react';
import ImageStore from '../stores/ImageStore.js';
import FFCheck from './FFCheck.js';

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
  }

  componentWillMount() {
    this.checkBoxes = new Set();
  }
  
  render() {
    /* FIXME: race condition on initial load, selected image still null, need to handle async properties */
    var image = ImageStore.getSelectedImage();
    var i = 0;
    return (
      <div id="tag-form" className="container tag-form column">
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
