import React from 'react';
import request from 'browser-request';
import { Link } from 'react-router';
import {
  VictoryBar, VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, Bar,
  VictoryLabel, VictoryTooltip, VictoryGroup, VictoryScatter, Point
} from 'victory';
import ReactTooltip from 'react-tooltip';

import { amplitude, API_BASE_URL, errToString } from '../util/Util.js';
import FBBlock from './FBBlock.jsx';

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
      }
    }.bind(this)
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
      return (
        <div className="blue-border">
          <p className="loading"></p>
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
      return (
        <div className="blue-border">
          <p className="loading"></p>
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
              data: {
                fill: "blue",
                stroke: "white",
                strokeWidth: 2.0
              }
            }}
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
      return (
        <div className="blue-border">
          <p className="loading"></p>
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
        dx={(datum) => datum.y > 20 ? (20 - datum.y) * 10 : 0}
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
        <p>Am I mister consistent-and-reliable, creating fruit art day in and day out?</p>
        <FFChartMonth/>
        <p>Nope, it's highly variable, as you can see. For example, what happened in November 2015? Thanksgiving travels, and I got more responsibility at work.</p>
        <h2>Time of Day Frequency</h2>
        <p>Like most families with young children, mornings are hectic, as a rule. Is there a pattern to the time of day when I can find the time and space to sculpt fruit?</p>
        <FFChartTOD/>
        <p>Yup. That looks like a very standard gaussian distribution, between 7:00 - 7:40 am.</p>
        <p>
          Statistically speaking:<br/>
          <code style={{ width: '100%' }}>
            Median: <b>7:21 am</b><br/>
            Mean: <b>7:20 am</b><br/>
            Standard deviation: <b>26 minutes, 10 seconds</b><br/>
          </code>
        </p>
        <p>
        <code>
          ff=# select stddev_pop(abs_minute) from morning_minute;<br/>
          stddev_pop<br/>
          ---------------------<br/>
          <b>26.1714168522437236</b><br/>
        </code>
        <br/>
        I take an odd comfort in the predictability of the routines of daily life.
        </p>
        <h2>TODO: Daily Fluctuations</h2>
        <p>I spent over a year driving to Milpitas every Tuesday, rising and departing earlier than normal. Did fruit faces shift and/or curtail during that year? Tune in to find out!</p>
        <FBBlock/>
     </div>);
  }

}
