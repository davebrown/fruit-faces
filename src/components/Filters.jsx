import React from 'react';
import { RadioGroup, Radio } from 'react-radio-group';

import ImageStore from '../stores/ImageStore.js';
import FFActions from '../actions/FFActions.js';
import TagForm from './TagForm.js';

const TAGS = [ 'blue', 'gray', 'white' ];

export default class Filters extends React.Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      selectedValue: null
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
  }
  render() {
    return (
      <div className="filters">
        <p><b>Check one of the radio buttons</b> to highlight only particular images.</p>
        <RadioGroup name="fruit" selectedValue={this.state.selectedValue} onChange={this.handleChange}>
          {
            TAGS.map((tag) => {
              const key = 'filter-radio-' + tag;
              return <div key={key}><Radio value={tag}/>{tag.charAt(0).toUpperCase() + tag.slice(1) + ' plates'}<br/></div>
            })
          }
        </RadioGroup>
      </div>
      );
      
  }
}

