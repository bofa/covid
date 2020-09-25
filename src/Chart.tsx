// tslint:disable: jsx-wrap-multiline

import * as React from 'react';
import * as moment from 'moment';
// import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

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
    // .slice(size)
    .map((v1, i1) => ({
      t: v1.t,
      y: list
        // .slice(i1 - size, i1)
        .filter((_2, i2) => i2 > i1 - size && i2 <= i1 )
        .map(({ y }) => y / (size + 1))
        .reduce((acc, v) => acc + v)
      }));

  return output;
}

export interface Series {
  label: string;
  data: { t: moment.Moment, y: number }[];
}

interface ChartProps {
  series: Series[];
  smooth: number;
  slice: number;
  annotations: boolean;
}

export default function Chart(props: ChartProps) {
  // const { analyses, chartItems } = props;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        type: 'time'
      }]
    },
    annotation: {
      annotations: props.annotations
      ? [{
          drawTime: 'afterDraw', // overrides annotation.drawTime if set
          type: 'line',
          mode: 'horizontal',
          scaleID: 'y-axis-0',
          value: 20 / 14 * 10,
          borderColor: 'red',
          borderWidth: 2,
          label: { position: 'left', content: 'Norway limit', enabled: true }
        },
        {
          drawTime: 'afterDraw', // overrides annotation.drawTime if set
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

  const formattedSeries: ChartData = {
    datasets: props.series
      .map((s, i) => ({
        fill: false,
        // backgroundColor: rgba(i),
        borderColor: rgba(s.label),
        label: s.label,
        data: smooth(s.data, props.smooth).slice(props.slice)
      }))
  };

  // console.log('formattedSeries', props.series, props.smooth, formattedSeries);

  return <Line data={formattedSeries} options={options} />;
}