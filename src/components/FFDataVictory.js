import React from 'react';
import request from 'browser-request';

import { Link } from 'react-router';

import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, Bar, VictoryLabel, VictoryTooltip } from 'victory';

const DOW_VALUES = [
  {
        day: "Sun",
        count: 11
      },
      {
        day: "Mon",
        count: 58
      },
      {
        day: "Tue",
        count: 65
      },
      {
        day: "Wed",
        count: 63
      },
      {
        day: "Thu",
        count: 64
      },
      {
        day: "Fri",
        count: 64
      },
      {
        day: "Sat",
        count: 1
      }
    ]

const DOW_DATA = [
  {
    name: "Day of Week",
    values: DOW_VALUES
  }];


const MONTH_DATA = [
  {
    "name": "Month",
    "values": [{"x":"Feb 2014","y":12, label: 'Feb \'14: 12 faces'},{"x":"Mar 2014","y":18},{"x":"Apr 2014","y":14},{"x":"May 2014","y":16},{"x":"Jun 2014","y":10},{"x":"Jul 2014","y":11},{"x":"Aug 2014","y":8},{"x":"Sep 2014","y":11},{"x":"Oct 2014","y":17},{"x":"Nov 2014","y":8},{"x":"Dec 2014","y":12},{"x":"Jan 2015","y":15},{"x":"Feb 2015","y":10},{"x":"Mar 2015","y":16},{"x":"Apr 2015","y":12},{"x":"May 2015","y":2},{"x":"Jun 2015","y":1},{"x":"Jul 2015","y":6},{"x":"Aug 2015","y":17},{"x":"Sep 2015","y":14},{"x":"Oct 2015","y":7},{"x":"Nov 2015","y":1},{"x":"Dec 2015","y":3},{"x":"Jan 2016","y":3},{"x":"Mar 2016","y":13},{"x":"Apr 2016","y":9},{"x":"May 2016","y":11},{"x":"Jun 2016","y":14},{"x":"Jul 2016","y":5},{"x":"Aug 2016","y":10},{"x":"Sep 2016","y":16},{"x":"Oct 2016","y":2},{"x":"Nov 2016","y":2}]
}];

export default class FFDataVictory extends React.Component {

  constructor(props) {
    super(props);
  }

 
  render() {
    var dowChart = (
        <VictoryChart
      theme={VictoryTheme.material}
        >
        <VictoryBar
      data={DOW_VALUES}
      x="day"
      y="count"
      style={{
        data: {fill: '#4070ff', padding: 0, width: 7.0 },
        labels: {fontSize: 6},
      }}
        />
        </VictoryChart>
    );

    var monthChart = (
            <VictoryChart
            theme={VictoryTheme.material}
            >
            <VictoryAxis
            style={{
              axis: { strokeWidth: 0 },
              tickLabels: {fontSize: 6, padding: 10, angle: 0 }
            }}
            //tickLabelComponent={<VictoryLabel dy={-.5}/>}
            //tickLabelComponent={<VictoryLabel textAnchor='start'/>}
            //offsetX={-20}
            //offsetY={20}
            //fixLabelOverlap={true}
            //domainPadding={0}
            />
            <VictoryAxis
            dependentAxis={true}
            style={{
              axis: { strokeWidth: 0 },
              tickLabels: {fontSize: 6, angle: 0, padding: 0 },
              ticks: { strokeWidth: 0 },
              grid: { strokeWidth: 0 }
            }}
            tickLabelComponent={<VictoryLabel textAnchor='end'/>}
            />
            <VictoryBar
            data={MONTH_DATA[0].values}
            labelComponent={<VictoryTooltip/>}
            //labels={(datum) => datum.y}
            style={{
              data: {fill: '#4070ff', padding: 0, width: 7.0 },
              labels: {fontSize: 6},
            }}
            horizontal={true}
            x="x"
            y="y"/>
            </VictoryChart>
    );

    return (<div>
            <h1>Data</h1>
            <p>When I have a collection of data, I&apos;m curious about it. I&apos;m weird like that. Plus I really like charts.</p>
            <h2>Day of Week Frequency</h2>
            <p>I often get up a little bit earlier than my family, to prep breakfast, walk the dog, and have some
            quiet time before the morning rush begins. Still, I don&apos;t always have time/inclination to be 
            the <a href="https://en.wikipedia.org/wiki/Michelangelo">Michelangelo</a> of fruit. Are there days of the
            week when I&apos;m more likely than others to indulge my peculiar little hobby?
            </p>
            {dowChart}
            <p>Turns out, no: consistent distribution across weekdays, though not weekends. On Saturday, we meet
            neighborhood friends at the bakery, and usually make waffles etc. on Sundays.
            </p>
            <h2>Monthly Frequency</h2>
            <p>Highly variable:</p>
            {monthChart}
            <p>as you can see.</p>
            <h2>In conclusion</h2>
            <p>Lorem ipsum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <h2>In conclusion</h2>
            <p>Lorem ipsum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <h2>In conclusion</h2>
            <p>Lorem ipsum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <h2>In conclusion</h2>
            <p>Lorem ipsum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <h2>In conclusion</h2>
            <p>Lorem ipsum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div>);
  }

}
