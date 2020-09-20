// tslint:disable: jsx-wrap-multiline

import * as React from 'react';
import * as moment from 'moment';
// import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

export function rgba(index: number, alpha: number = 0.6) {
  const o = Math.round, r = (seed: number) => Math.sin(seed * index) ** 2, s = 255;
  return 'rgba(' + o(r(1) * s) + ',' + o(r(2) * s) + ',' + o(r(3) * s) + ',' + alpha + ')';
}

export function smooth(list: { t: moment.Moment, y: number }[], size: number) {
  const output = list
    // .slice(size)
    .map((v1, i1) => ({
      t: v1.t,
      y: list
        .filter((_2, i2) => i2 > i1 - size && i2 <= i1 )
        .map(({ y }) => y)
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
    }
  };

  const formattedSeries: ChartData = {
    datasets: props.series
      .map((s, i) => ({
        fill: false,
        // backgroundColor: rgba(i),
        borderColor: rgba(i),
        label: s.label,
        data: smooth(s.data, props.smooth)
      }))
  };

  return <Line data={formattedSeries} options={options} />;
}