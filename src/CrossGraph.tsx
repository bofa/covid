// tslint:disable: no-shadowed-variable

import * as React from 'react';
// import { xcorr } from './xcorr';
// import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import { smooth } from './Chart';
import { Button, MenuItem, Slider } from '@blueprintjs/core';
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select';
import { Line } from 'react-chartjs-2';
import { xcorr } from './xcorr';

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
  const smoothed = smooth(series.data, smoothLength).map(d => d.y)
    .slice(Math.max(0, slice));

  // const mean = data.reduce((sum, v) => sum + v) / data.length;
  // const std = data.reduce((sum, v) => sum + (v - mean) ** 2) ** 0.5;
  const mean = 0;
  const std = 1; // Math.max(...smoothed);

  const normal = smoothed
    .map(v => (v - mean) / std);

  return [normal, smoothed];
}

export const options1: ChartOptions = {
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

export const options2: ChartOptions = {
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
      // ticks: {
      //   max: 0.2,
      // }
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
    timeOffset: -14,
    sliceSlider: 0,
    scaleSlider: 1,
  };

  constructor(props: any) {
    super(props);
  }

  selectRegion = (series: Series) => {
    const label = series.label;
    this.props.onSelection([label]);

    const selectedSeries = label;
    const casesSeries = this.props.cases.find(s => s.label === selectedSeries);
    const fatalitiesSeries = this.props.fatalities.find(s => s.label === selectedSeries);

    const timeOffset = this.state.timeOffset;

    const smoothing = +this.props.smoothing;
    const slice = this.state.sliceSlider;
    
    const [casesNormalized] = casesSeries
      ? normalize(casesSeries, smoothing, slice + Math.max(0, timeOffset))
      : [[], []];
    
    const [fatalitiesNormalized] = fatalitiesSeries
      ? normalize(fatalitiesSeries, smoothing, slice + Math.max(0, -timeOffset))
      : [[], []];

    const tail = 30;
    const delta = fatalitiesNormalized.length - casesNormalized.length;

    const casesSum = casesNormalized
      .slice().reverse().slice(Math.max(0, -delta), tail + Math.max(0, -delta)).reduce((s, c) => s + c, 0);
    const fatalitiesSum = fatalitiesNormalized
      .slice().reverse().slice(Math.max(0, delta), tail + Math.max(0, delta)).reduce((s, f) => s + f, 0);

    const scaleSlider = casesSum / fatalitiesSum;

    console.log('scaleSlider', scaleSlider);

    this.setState({ scaleSlider });
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

    const timeOffset = this.state.timeOffset;

    const smoothing = +this.props.smoothing;
    const slice = this.state.sliceSlider;
    
    const [casesNormalized, casesSmoothed] = casesSeries
      ? normalize(casesSeries, smoothing, slice + Math.max(0, timeOffset))
      : [[], []];
    
    const [fatalitiesNormalized, fatalitiesSmoothed] = fatalitiesSeries
      ? normalize(fatalitiesSeries, smoothing, slice + Math.max(0, -timeOffset))
      : [[], []];

    const fatalitiesFitted = fatalitiesNormalized
      .map(f => f * this.state.scaleSlider);

    const corr = xcorr(
      casesSmoothed,
      fatalitiesSmoothed,
      30
    );

    const chartData1: ChartData = { datasets: [
      {
        label: 'Cases',
        borderColor: 'red',
        fill: false,
        data: casesNormalized.map((v, i) => ({ x: i, y: v }))
      },
      {
        label: 'Fatalities',
        borderColor: 'blue',
        fill: false,
        data: fatalitiesFitted.map((v, i) => ({ x: i, y: v }))
      }
    ]};

    const chartData2: ChartData = { datasets: [
      {
        label: 'Cross Covariance, time shift "correlation"',
        data: corr
      },
    ]};

    // console.log('chartData', chartData);

    return (
      <React.Fragment>
        <RegionSelect
          itemPredicate={filterSeries}
          itemRenderer={itemRenderer}
          items={this.props.fatalities}
          onItemSelect={this.selectRegion}
        >
          <Button text={this.props.selectedItems[0]} rightIcon="double-caret-vertical" />
        </RegionSelect>
        <Slider
          min={0}
          max={casesSeries?.data.length}
          stepSize={1}
          labelRenderer={false}
          onChange={sliceSlider => this.setState({ sliceSlider })}
          value={this.state.sliceSlider}
          vertical={false}
        />
        {timeOffset}
        <Slider
          min={-50}
          max={50}
          stepSize={1}
          labelRenderer={false}
          onChange={timeOffset => this.setState({ timeOffset })}
          value={timeOffset}
          vertical={false}
        />
        {this.state.scaleSlider}
        <Slider
          min={0}
          max={5 * Math.max(0, ...casesNormalized) / Math.max(0, ...fatalitiesNormalized)}
          stepSize={1}
          labelRenderer={false}
          onChange={scaleSlider => this.setState({ scaleSlider })}
          value={this.state.scaleSlider}
          vertical={false}
        />
        <div style={{ height: 340 }}>
          <Line data={chartData1} options={options1} />
        </div>
        <div style={{ height: 340 }}>
          <Line data={chartData2} options={options2} />
        </div>
      </React.Fragment>
    );
  }
}