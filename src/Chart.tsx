// tslint:disable: jsx-wrap-multiline

import * as React from 'react';
import * as moment from 'moment';
// import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

function hashCode(str: string) {
  return str.split('').reduce((prevHash, currVal) =>
    // tslint:disable-next-line: no-bitwise
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
}

export function rgba(label: string, alpha: number = 0.6) {
  const index = hashCode(label);
  const o = Math.round, r = (seed: number) => Math.sin(seed * index) ** 2, s = 255;
  return 'rgba(' + o(r(1000) * s) + ',' + o(r(-2000) * s) + ',' + o(r(30) * s) + ',' + alpha + ')';
}

export function smooth(list: { t: moment.Moment, y: number }[], size: number) {
  if (isNaN(size)) {
    const cumulative = list
      .map((v1, i1) => ({
        t: v1.t,
        y: list
          .filter((_2, i2) => i2 <= i1 )
          .map(({ y }) => y)
          .reduce((acc, v) => acc + v)
        }));

    return cumulative;
  }

  const output = list
    .map(d => ({
      y: d.y,
      t: d.t,
      ms: d.t.valueOf(),
      msLow: d.t.clone().subtract(size - 1, 'days').valueOf(),
    }))
    .map((v1, i1, a1) => ({
      t: v1.t,
      y: a1
        .filter((v2) => v2.ms >= v1.msLow && v2.ms <= v1.ms)
        .map(({ y }, i, a) => y / (a.length))
        .reduce((acc, v) => acc + v)
      }));

  return output;
}

export interface Series {
  label: string;
  data: { t: moment.Moment, y: number }[];
  total: number;
}

interface ChartProps {
  series: Series[];
  smooth: number;
  slice: number[];
  annotations: boolean;
  xAxis: string;
}

export default function Chart(props: ChartProps) {
  // const { analyses, chartItems } = props;

  const formattedSeries = props.series
    .map((s, i) => ({
      fill: false,
      pointRadius: 1,
      // backgroundColor: rgba(i),
      borderColor: rgba(s.label),
      label: s.label,
      data: smooth(s.data, props.smooth)
    }));

  const chartData: ChartData = {
    datasets: formattedSeries
  };

  const time = formattedSeries.map(s => s.data
    .filter(d => d.t.isBetween(props.slice[0], props.slice[1])).map(d => d.y)).reduce((a, b) => a.concat(b), []);
  const min = Math.min(0, ...time);
  const max = Math.max(...time);

  const options: ChartOptions & { annotation: any } = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        type: 'time',
        ticks: {
          min: props.slice[0],
          max: props.slice[1],
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: props.xAxis,
        },
        // type: 'time',
        ticks: {
          min: min,
          max: 1.1 * max,
        }
      }]
    },
    annotation: {
      annotations: props.annotations
      ? [{
          drawTime: 'beforeDatasetsDraw', // overrides annotation.drawTime if set
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: 20 / 14 * 10,
          borderColor: 'red',
          borderWidth: 2,
          label: { position: 'left', content: 'Norway limit', enabled: true }
        },
        {
          drawTime: 'beforeDatasetsDraw', // overrides annotation.drawTime if set
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: 50 / 14 * 10,
          borderColor: 'red',
          borderWidth: 2,
          label: { position: 'left', content: 'Germany limit', enabled: true }
        }
      ]
      : []
    }
  };

  // console.log('formattedSeries', props.series, props.smooth, formattedSeries);

  return <Line data={chartData} options={options} />;
}