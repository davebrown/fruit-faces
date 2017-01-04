import React from 'react';
import request from 'browser-request';

import { Link } from 'react-router';

import { BarChart } from 'rd3';


const DOW_DATA = [
  {
    "name": "Day of Week",
    "values": [
      {
        "x": "Sun",
        "y": 11
      },
      {
        "x": "Mon",
        "y": 58
      },
      {
        "x": "Tue",
        "y": 65
      },
      {
        "x": "Wed",
        "y": 63
      },
      {
        "x": "Thu",
        "y": 64
      },
      {
        "x": "Fri",
        "y": 64
      },
      {
        "x": "Sat",
        "y": 1
      }
    ]
  }];

class FFData extends React.Component {

  constructor(props) {
    super(props);
  }

 
  render() {
    var rd3Chart = '';
    rd3Chart = (<div className="chart green-border"><BarChart
            data={DOW_DATA}
            width={300}
            height={180}
            title="DoW Chart"
            xAxisLabel="Day"
                yAxisLabel="Count"
                className="red-border"
                    /></div>);

    return (<div className="data blue-border">
            <h2>Data</h2>
            <p>Lorem ipsum. Interesting chart.</p>
            {rd3Chart}
            </div>
           );
  }
}

export default FFData;
