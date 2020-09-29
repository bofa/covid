import * as React from 'react';
import * as moment from 'moment';
import axios from 'axios';
import Chart, { Series } from './Chart';
import { FormGroup, RangeSlider } from '@blueprintjs/core';
// import GridLayout from 'react-grid-layout';
import { Responsive, WidthProvider } from 'react-grid-layout';
// const neatCsv = require('neat-csv');
// import csvParse from 'csv-parse';
import * as Papa from 'papaparse';

const ResponsiveGridLayout = WidthProvider(Responsive);

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import SelectChartItems from './SelectRegion';

export const convertArrayToObject = (array: any[], key: string | number) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    };
  }, initialValue);
};

interface MainProps {
}

function massageExcessDeaths(response: any) {
  const parsed = Papa.parse(response.data).data as any[][];
  const label = parsed[1][0];

  const data = parsed.slice(1)
    .map(r => ({
      t: moment(r[4]),
      y: r[11] / r[7] * 1000000
        / (1 + moment(r[4]).diff(moment(r[3]), 'days')),
    }))
    .filter(d => d.t.isValid && !isNaN(d.y));

  const series: Series = {
    label,
    data
  };

  return series;
}

export class Main extends React.Component<MainProps> {

  regions$: any;

  state = {
    selectedItems: ['Sweden', 'Germany'] as string[],
    group: 'series' as 'series' | 'fatalities' | 'excess',
    smooth: '7',
    series: [] as Series[],
    fatalities: [] as Series[],    
    excess: [] as Series[],
    slider: [0, 1] as [number, number],
  };

  selectGroup = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const group = event.target.value as 'series' | 'fatalities' | 'excess';

    if (group === 'series' && this.state.series.length < 1) {
      this.loadCases();
    } else if (group === 'fatalities' && this.state.fatalities.length < 1) {
      this.loadCovidFatalities();
    } else if (group === 'excess' && this.state.excess.length < 1) {
      this.loadExcessFatalities();
    }

    this.setState({ group });
  }

  componentDidMount() {
    this.loadCases();  
  }

  loadCases = () => {
    axios.get('cases.json')
      .then((response: any) => {
        this.setState({
          series: response.data,
        });
      });
    }

    loadCovidFatalities = () => {
      axios.get('fatalities.json')
        .then((response: any) => {
          this.setState({
            fatalities: response.data,
          });
        });
    }

  loadExcessFatalities = (labels = []) => {
    // tslint:disable-next-line: max-line-length
    // const baseUrl = 'https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/source-data/';
    const baseUrl = 'https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/output-data/excess-deaths/';
    const endUrl = '_excess_deaths.csv';

    [
      'sweden', 'germany', 'netherlands', 'turkey', 'belgium', 'norway', 'spain'
      // 'france', 'spain', 'chile'
    ].forEach(label => axios.get(baseUrl + label + endUrl)
      .then(r => massageExcessDeaths(r))
      .then(series => {
        this.setState({
          excess: this.state.excess.concat(series)
        });
      })
    );
  }

  render() {

    const group = this.state[this.state.group] as Series[];

    const smoothedSeries = group
      .filter(s => this.state.selectedItems.includes(s.label))
      .map(s => ({
        label: s.label,
        data: s.data.map(d => ({ t: moment(d.t), y: d.y }))
      }));

    const time = smoothedSeries.map(s => s.data.map(d => d.t.valueOf())).reduce((a, b) => a.concat(b), []);
    const min = Math.min(...time);
    const max = Math.max(...time);

    const slice = this.state.slider.map(value => min + value * (max - min));

    return (
      <div style={{ padding: 15, height: window.innerHeight - 150 }}>
        <ResponsiveGridLayout className="layout" rowHeight={30} cols={{lg: 8, md: 8, sm: 8, xs: 2, xxs: 2}}>
          <FormGroup
            key="group"
            data-grid={{x: 0, y: 0, w: 1, h: 2, static: true}}
            label="Group"
            labelFor="select"
          >
            <div className="bp3-select">
              <select
                value={this.state.group}
                onChange={this.selectGroup}  
              >
                <option value="series">Cases</option>
                <option value="fatalities">COVID Fatalities</option>
                <option value="excess">Excess Fatalities</option>
              </select>
            </div>
          </FormGroup>
          <FormGroup
            key="smoothing"
            data-grid={{x: 1, y: 0, w: 1, h: 2, static: true}}
            label="Smoothing"
            labelFor="select"
          >
            <div className="bp3-select">
              <select
                value={this.state.smooth}
                onChange={e => this.setState({ smooth: e.target.value })}  
              >
                <option value="1">Day</option>
                <option value="2">2 Days</option>
                <option value="7">Week</option>
                <option value="14">2 Weeks</option>
                <option value="30">Month</option>
                <option value="cumulative">Cumulative</option>
              </select>
            </div>
          </FormGroup>
          <FormGroup
            data-grid={{x: 2, y: 0, w: 6, h: 2, static: true}}
            key="regions"
            label="Regions"
            labelFor="regions"
          >
            <SelectChartItems
              items={group}
              selectedItems={this.state.selectedItems}
              onSelection={selectedItems => this.setState({ selectedItems })}
            />
          </FormGroup>
          <FormGroup
            data-grid={{x: 1, y: 2, w: 10, h: 1, static: true}}
            key="slider"
          >
            <RangeSlider
              min={0}
              max={1}
              stepSize={0.02}
              labelRenderer={false}
              onChange={slider => this.setState({ slider })}
              value={this.state.slider}
              vertical={false}
            />
          </FormGroup>
        </ResponsiveGridLayout>
        <Chart
          series={smoothedSeries}
          smooth={+this.state.smooth}
          slice={slice}
          annotations={this.state.group === 'series' && !isNaN(+this.state.smooth)}
        />
      </div>
    );
  }
}
