// tslint:disable: no-shadowed-variable

import * as React from 'react';
// import { xcorr } from './xcorr';
// import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { smooth } from './Chart';
import { Button, MenuItem, Slider } from '@blueprintjs/core';
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select';
import { Line } from 'react-chartjs-2';

const RegionSelect = Select.ofType<Series>();

const itemRenderer: ItemRenderer<Series> = (s: Series, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
      return null;
  }
  
  return (
    <MenuItem
      // active={modifiers.active}
      key={s.label}
      onClick={handleClick}
      text={s.label}
    />
  );
};

const filterSeries: ItemPredicate<Series> = (query: string, series: Series) => {
  return series.label.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};

function normalize(series: Series, smoothLength: number, slice: number) {
  const data = smooth(series.data, smoothLength).map(d => d.y);
  // const mean = data.reduce((sum, v) => sum + v) / data.length;
  // const std = data.reduce((sum, v) => sum + (v - mean) ** 2) ** 0.5;
  const mean = 0;
  const std = Math.max(...data);

  const normal = data
    .slice(slice + Math.max(0, slice))
    .map(v => (v - mean) / std);

  return normal;
}

export const options: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    xAxes: [{
      type: 'linear'
    }],
    yAxes: [{
      scaleLabel: {
        display: true,
      },
    }]
  },
};

interface CrossGraphProps {
  cases: Series[];
  fatalities: Series[];
  selectedItems: string[];
  smoothing: string;
  onSelection: (selectedItems: string[]) => void;
}

export default class CrossGraph extends React.Component<CrossGraphProps> {

  state = {
    slider: 0,
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    const selectedSeries = this.props.selectedItems[0];
    const casesSeries = this.props.cases.find(s => s.label === selectedSeries);
    const fatalitiesSeries = this.props.fatalities.find(s => s.label === selectedSeries);

    // const cases = Array.from({ length: 10 }, (_, i) => Math.random()); // Math.cos(i / 2));
    // const fatalities = [0, 0, 0, ...cases.slice(0, cases.length - 3)];

    // if (!casesSeries || !fatalitiesSeries) {
    //   return 'No Data';
    // }

    const slider = this.state.slider;

    const smoothing = +this.props.smoothing;
    const slice = 0;
    
    const cases = casesSeries
      ? normalize(casesSeries, smoothing, slice + Math.max(0, slider))
      : [];
    
    const fatalities = fatalitiesSeries
      ? normalize(fatalitiesSeries, smoothing, slice + Math.max(0, -slider))
      : [];

    // console.log('cases', cases);
    // console.log('fatalities', fatalities);
    
    // const corr = xcorr(cases, fatalities, 100);
    // console.log('corr', corr);

    const chartData1: ChartData = { datasets: [
      {
        label: 'Cases',
        borderColor: 'red',
        fill: false,
        data: cases.map((v, i) => ({ x: i, y: v }))
      },
      {
        label: 'Fatalities',
        borderColor: 'blue',
        fill: false,
        data: fatalities.map((v, i) => ({ x: i, y: v }))
      }
    ]};

    // const chartData2: ChartData = { datasets: [
    //   {
    //     label: 'xcorr',
    //     data: corr
    //   },
    // ]};

    // console.log('chartData', chartData);

    return (
      <React.Fragment>
        <RegionSelect
          itemPredicate={filterSeries}
          itemRenderer={itemRenderer}
          items={this.props.fatalities}
          onItemSelect={(series: Series) => this.props.onSelection([series.label])}
        >
          <Button text={this.props.selectedItems[0]} rightIcon="double-caret-vertical" />
        </RegionSelect>
        {slider}
        <Slider
          min={-50}
          max={50}
          stepSize={1}
          labelRenderer={false}
          onChange={slider => this.setState({ slider })}
          value={this.state.slider}
          vertical={false}
        />
        <Line data={chartData1} options={options} />
      </React.Fragment>
    );
  }
}