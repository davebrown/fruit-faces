import React from 'react';
import request from 'browser-request';
import { Link } from 'react-router';
import {
  VictoryBar, VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, Bar,
  VictoryLabel, VictoryTooltip, VictoryGroup, VictoryScatter, Point
} from 'victory';
import { amplitude, API_BASE_URL, errToString } from '../util/Util.js';

var MONTH_DATA = [{x:'Banana', y: 14, label: 'some fairly long text'}];

const chartPadding = {
  top: 20,
  bottom: 30,
  left: 40,
  right: 40
}

class FFChartDOW extends React.Component {

  constructor(props) {
    super(props);
    this.state = { data: null };
    this.loadData = this.loadData.bind(this);
  }

  componentWillMount() {
    this.loadData();
  }

  loadData() {
    request(API_BASE_URL + '/api/v1/stats/day-of-week', function(err, response, bodyString) {
      if (err) {
        var errMsg = errToString(err);
        amplitude.logEvent('DOW_STATS_LOAD_ERROR', { errorMsg: errMsg });
        this.setState({error: errMsg});
      } else {
        var dowData = JSON.parse(bodyString);
        this.setState({data: dowData});
        console.debug('loaded DOW data: ' + dowData.length);
      }
    }
        .bind(this)
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error">
          <p>Error fetching data: {this.state.error.toString()}</p>
        </div>
      );
    } else if (this.state.data == null) {
      // FIXME: loading spinner or something...
      return (
        <div>
          <p><i>Loading data...</i></p>
        </div>
      );
    }
    return (
      <VictoryChart
        theme={VictoryTheme.material}
        padding={chartPadding}
      >

        <VictoryAxis
          style={{
            axis: { strokeWidth: 0 },
            tickLabels: {fontSize: 10, angle: 0, padding: 0 },
            ticks: { strokeWidth: 0 },
            grid: { strokeWidth: 0 }
          }}
        />
        
        <VictoryBar
          data={this.state.data}
          x="day"
          y="count"
          labels={(datum) => datum.y}
          style={{
            data: {fill: '#4070ff', padding: 0, width: 20.0 },
            labels: {fontSize: 10 },
          }}
        />
      </VictoryChart>
    );
  }
}

class FFChartTOD extends React.Component {

  constructor(props) {
    super(props);
    this.state = { data: null };
    this.loadData = this.loadData.bind(this);
  }

  componentWillMount() {
    this.loadData();
  }

  loadData() {
    request(API_BASE_URL + '/api/v1/stats/time-of-day', function(err, response, bodyString) {
      if (err) {
        var errMsg = errToString(err);
        amplitude.logEvent('TOD_STATS_LOAD_ERROR', { errorMsg: errMsg });
        this.setState({error: errMsg});
      } else {
        var todData = JSON.parse(bodyString);
        this.setState({data: todData});
        console.debug('loaded TOD data: ' + todData.length);
      }
    }
    .bind(this)
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error">
          <p>Error fetching data: {this.state.error.toString()}</p>
        </div>
      );
    } else if (this.state.data == null) {
      // FIXME: loading spinner or something...
      return (
        <div>
          <p><i>Loading data...</i></p>
        </div>
      );
    }
    return (
      <VictoryChart
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          style={{
            axis: { strokeWidth: 0 },
            tickLabels: {fontSize: 6, angle: -90, padding: 0 },
            ticks: { strokeWidth: 0 },
            grid: { strokeWidth: 0 }
          }}
          label="Time of Day"
          tickLabelComponent={<VictoryLabel textAnchor='end'/>}
          axisLabelComponent={<VictoryLabel verticalAnchor='end' dy={2.5}/>}
        />
        <VictoryAxis
          dependentAxis={true}
          style={{
            axis: { strokeWidth: 0 },
            ticks: { strokeWidth: 0 },
          }}
          label="Count"
          axisLabelComponent={<VictoryLabel dy={-2.5}/>}
        />
        <VictoryGroup
          data={this.state.data}
          x="time"
          y="count"
        >
          <VictoryLine/>
          <VictoryScatter
            style={{
              labels: {fontSize: 10 },
              data: {
                fill: "white",
                stroke: "blue",
                strokeWidth: 1.5
              }
            }}
            labelsx={(datum) => datum.x > 20 ? datum.x : null}
            labelComponent={<VictoryTooltip/>}
          />
        </VictoryGroup>
      </VictoryChart>
    );
  }
}

class FFChartMonth extends React.Component {

  constructor(props) {
    super(props);
    this.state = { data: null };
    this.loadData = this.loadData.bind(this);
  }

  componentWillMount() {
    this.loadData();
  }

  loadData() {
    request(API_BASE_URL + '/api/v1/stats/by-month', function(err, response, bodyString) {
      if (err) {
        var errMsg = errToString(err);
        amplitude.logEvent('MONTH_STATS_LOAD_ERROR', { errorMsg: errMsg });
        this.setState({error: errMsg});
      } else {
        var monthData = JSON.parse(bodyString);
        this.setState({data: monthData});
        console.debug('loaded month data: ' + monthData.length);
      }
    }
     .bind(this)
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error">
          <p>Error fetching data: {this.state.error.toString()}</p>
        </div>
      );
    } else if (this.state.data == null) {
      // FIXME: loading spinner or something...
      return (
        <div>
          <p><i>Loading data...</i></p>
        </div>
      );
    }
    var tooltipLabel = (
      <VictoryLabel
        style={{
          fontSize: 9
        }}
      />
    );
    var tooltip = (
      <VictoryTooltip
        labelComponent={ tooltipLabel }
        dx={(datum) => datum.y > 14 ? (14 - datum.y) * 14 : 0}
      />
    );

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        padding={chartPadding}
      >
        <VictoryAxis
          style={{
            axis: { strokeWidth: 0 },
            tickLabels: {fontSize: 10, padding: 5, angle: 0 }
          }}
        />
        <VictoryAxis
          dependentAxis={true}
          style={{
            axis: { strokeWidth: 0 },
            tickLabels: {fontSize: 8, angle: 0, padding: 0 },
            ticks: { strokeWidth: 0 },
            grid: { strokeWidth: 0 }
          }}
          tickLabelComponent={<VictoryLabel textAnchor='end'/>}
        />
        <VictoryBar
          data={this.state.data}
          //labels={(datum) => datum.y}
          style={{
            data: {fill: '#4070ff', padding: 0, width: 9.0 },
            labels: {fontSize: 6},
          }}
          labelComponent={ tooltip }
          horizontal={true}
          x="x"
          y="y"/>
      </VictoryChart>
    );
  }
}

export default class FFDataVictory extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div>
        <h1>Data</h1>
        <p>When I have a collection of data, I&apos;m curious about it. I&apos;m weird like that. Plus I really like charts.</p>
        <h2>Day of Week Frequency</h2>
        <p>I often get up a little bit earlier than my family, to prep breakfast, walk the dog, and have some
          quiet time before the morning rush begins. Still, I don&apos;t always have time/inclination to be 
          the <a href="https://en.wikipedia.org/wiki/Michelangelo">Michelangelo</a> of fruit. Are there days of the
          week when I&apos;m more likely than others to indulge my peculiar little hobby?
        </p>
        <FFChartDOW/>
        <p>Turns out, no: consistent distribution across weekdays, though not weekends. On Saturday, we meet
          neighborhood friends at the bakery, and usually make waffles etc. on Sundays.
        </p>
        <h2>Monthly Frequency</h2>
        <p>Highly variable:</p>
        <FFChartMonth/>
        <p>as you can see.</p>
        <h2>Time of Day</h2>
        <p>Hectic mornings to sculpt fruit - is there a pattern to time of day?</p>
        <FFChartTOD/>
        <h2>In conclusion</h2>
        <p>Lorem ipsum.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>);
  }

}
