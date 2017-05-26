import React from 'react';
import { RadioGroup, Radio } from 'react-radio-group';

import ImageStore from '../stores/ImageStore.js';
import FFActions from '../actions/FFActions.js';
import TagForm from './TagForm.js';
import { amplitude } from '../util/Util.js';
const TAGS = [ 'blue', 'gray', 'white', 'strawberry' ];

const FRUITS = [ 'apple', 'bacon', 'banana', 'blackberry', 'blueberry', 'cantaloupe', 'cereal', 'cheese',
                 'clementine', 'googly eyes', 'grape', 'honeydew', 'kiwi', 'mango', 'peach', 'pear', 'pineapple',
                 'plum', 'raspberry', 'strawberry', 'try harder Dad!', 'watermelon' ];

export default class Filters extends React.Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      selectedValue: ImageStore.getFilterTag()
    }
  }

  handleChange(evt) {
    var val = evt;
    // clicking on selected value un-selects it
    if (val === this.state.selectedValue) {
      val = null;
    }
    this.setState({ selectedValue: val });
    FFActions.filterChanged(val);
    if (val) {
      amplitude.logEvent('FILTER_SELECTED', { filter: val } );
    } else {
      amplitude.logEvent('FILTER_UNSELECTED', { } );
    }      
  }
  render() {
    return (
      <div className="filters">
        <h1>Filters</h1>
        <p className="sans-font"><b>Check one of the radio buttons</b> to highlight only particular images.</p>
        <RadioGroup name="plates" selectedValue={this.state.selectedValue} onChange={this.handleChange} className="form-group">
          <h2 className="form-label">Plates</h2>
          {
            TAGS.map((tag) => {
              const key = 'filter-radio-' + tag;
              return <label key={key} className="form-radio">
                <Radio value={tag}/>
                <i className="form-icon"></i> {tag.charAt(0).toUpperCase() + tag.slice(1) + ' plates'}
              </label>
            })
          }
        </RadioGroup>
        <h2 className="disabled">Fruits - coming soon</h2>
        <RadioGroup name="fruits" className="disabled">
          {
            FRUITS.map((tag) => {
              const key = 'filter-radio-' + tag;
              return <label key={key} className="form-radio">
                <Radio value={tag}/>
                <i className="form-icon"></i> {tag.charAt(0).toUpperCase() + tag.slice(1) + ' plates'}<br/>
              </label>
            })
          }
        </RadioGroup>
      </div>
      );
  }
}

