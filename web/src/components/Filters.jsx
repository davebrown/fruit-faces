import React from 'react';

import ImageStore from '../stores/ImageStore.js';
import FFActions from '../actions/FFActions.js';
import TagForm from './TagForm.js';
import { amplitude } from '../util/Util.js';
const TAGS = [ 'blue', 'gray', 'white' ];
const FRUITS = [ 'strawberry' ];
const FRUITS_X = [ 'apple', 'bacon', 'banana', 'blackberry', 'blueberry', 'cantaloupe', 'cereal', 'cheese',
                 'clementine', 'googly eyes', 'grape', 'honeydew', 'kiwi', 'mango', 'peach', 'pear', 'pineapple',
                 'plum', 'raspberry', 'strawberry', 'try harder Dad!', 'watermelon' ];

export default class Filters extends React.Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
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

  handleClear(evt) {
    this.setState({ selectedValue: null });
    FFActions.filterChanged(null);
  }

  render() {
    //         <p className="sans-font"><b>Check one of the radio buttons</b> to highlight only particular images.</p>
    return (
      <div className={'flex-column tag-form filters ' + (this.props.className || '')}>
        <h4 style={{ marginTop: '2px', marginBottom: '2px' }} className="text-center">Filters</h4>
        <button className="btn btn-primary btn-small" onClick={this.handleClear}>Clear</button>
        <div className="flex-column form-group">
          {
            TAGS.map((tag) => {
              const key = 'filter-radio-' + tag;
              return <label key={key} className="form-radio">
                <input type="radio" name="plates" value={tag} checked={this.state.selectedValue === tag}
                  onChange={() => this.handleChange(tag)}/>
                <i className="form-icon"></i> {tag.charAt(0).toUpperCase() + tag.slice(1) + ' plates'}
              </label>
            })
          }
          {
            FRUITS.map((tag) => {
              const key = 'filter-radio-' + tag;
              return <label key={key} className="form-radio">
                <input type="radio" name="plates" value={tag} checked={this.state.selectedValue === tag}
                  onChange={() => this.handleChange(tag)}/>
                <i className="form-icon"></i> {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </label>
            })
          }
        </div>
      </div>
      );
    /*
       <h2 className="disabled">Fruits - coming soon</h2>
       <RadioGroup name="fruits" className="disabled flex-column">
       {
       FRUITS.map((tag) => {
       const key = 'filter-radio-' + tag;
       return <label key={key} className="form-radio">
       <Radio value={tag} disabled="true"/>
       <i className="form-icon"></i> {tag.charAt(0).toUpperCase() + tag.slice(1)}<br/>
       </label>
       })
       }
       </RadioGroup>
     */    
  }
}

