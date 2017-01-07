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
    rd3Chart = (<div className="chart"><BarChart
            data={DOW_DATA}
            width={300}
            height={180}
            title="Fruit Face count by Day of Week"
            xAxisLabel="Day"
                yAxisLabel="Count"
                    /></div>);

    return (<div className="data">
            <h1>Data</h1>
            <p>When I have a collection of data, I&apos;m curious about it. I&apos;m weird like that. Plus I really like charts.</p>
            <h2>Day of Week Frequency</h2>
            <p>I often get up a little bit earlier than my family, to prep breakfast, walk the dog, and have some
            quiet time before the morning rush begins. Still, I don&apos;t always have time/inclination to be 
            the <a href="https://en.wikipedia.org/wiki/Michelangelo">Michelangelo</a> of fruit. Are there days of the
            week when I&apos;m more likely than others to indulge my peculiar little hobby?
            </p>
            {rd3Chart}
            <p>Turns out, no: consistent distribution across weekdays, though not weekends. On Saturday, we meet
            neighborhood friends at the bakery, and usually make waffles etc. on Sundays.
            </p>
            </div>
           );
  }
}

export default FFData;
