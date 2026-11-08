import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import request from 'browser-request';
import FFDataVictory from '../FFDataVictory.jsx';

jest.mock('browser-request', () => jest.fn());
jest.mock('../FBBlock.jsx', () => () => null);
jest.mock('../../util/Util.js', () => ({
  API_BASE_URL: '',
  amplitude: { logEvent: jest.fn() },
  errToString: error => String(error)
}));

const data = {
  'day-of-week': [
    { day: 'Mon', count: 12.34 },
    { day: 'Tue', count: 0 },
    { day: 'Wed', count: 2 }
  ],
  'by-month': [
    { x: "Jan '19", y: 12, label: "Jan '19: 12 faces" },
    { x: "Feb '19", y: 2, label: "Feb '19: 2 faces" }
  ],
  'time-of-day': [
    { time: '06:00', count: 0, label: '06:00 - 0 faces' },
    { time: '07:00', count: 12, label: '07:00 - 12 faces' },
    { time: '08:00', count: 3, label: '08:00 - 3 faces' }
  ]
};

function renderCharts() {
  request.mockImplementation((url, callback) => {
    callback(null, { statusCode: 200 }, JSON.stringify(data[url.split('/').pop()]));
  });
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<FFDataVictory/>);
  return container.querySelectorAll('.VictoryContainer > svg');
}

test('bar labels show data counts rounded to at most one decimal, not screen coordinates', () => {
  const chart = renderCharts()[0];
  const labels = Array.from(chart.querySelectorAll('tspan'))
    .map(label => label.textContent)
    .filter(label => /^-?\d+(\.\d+)?$/.test(label));

  expect(labels).toEqual(['12.3', '0', '2']);
});

test('time-of-day plots counts without invalid coordinates or series value labels', () => {
  const chart = renderCharts()[2];
  const paths = Array.from(chart.querySelectorAll('path'))
    .map(path => path.getAttribute('d'));

  expect(paths).toHaveLength(4);
  paths.forEach(path => expect(path).not.toMatch(/NaN|Infinity/));
  const pointHeights = paths.slice(1).map(path => Number(path.match(/^M\s*[^,]+,\s*([-\d.]+)/)[1]));
  expect(new Set(pointHeights).size).toBe(3);
  expect(chart.textContent).toContain('06:00');
  expect(chart.textContent).toContain('07:00');
  expect(chart.textContent).toContain('08:00');
  expect(chart.parentElement.textContent).not.toContain('faces');
});
