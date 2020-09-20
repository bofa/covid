// tslint:disable: jsx-wrap-multiline

import * as React from 'react';
// import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

export function rgba(index: number, alpha: number = 0.6) {
  const o = Math.round, r = Math.random, s = 255;
  return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + alpha + ')';
}

export function smooth(list: { t: moment.Moment, y: number }[], size: number) {
  const output = list
    // .slice(size)
    .map((v1, i1) => ({
      t: v1.t,
      y: list
        .filter((_2, i2) => i2 >= i1 - size && i2 <= i1 )
        .map(({ y }) => y)
        .reduce((acc, v) => acc + v)
      }));

  return output;
}

interface ChartProps {
  series: { label: string, data: { t: moment.Moment, y: number }[]}[];
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

  const remove = ['total', 'totalnonebev', 'totalbev'];

  const formattedSeries: ChartData = {
    datasets: props.series
      .filter(({ label }) => !remove.includes(label))
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