import * as React from 'react';
import * as moment from 'moment';
import axios from 'axios';
import Chart, { Series } from './Chart';
import { FormGroup } from '@blueprintjs/core';
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

function massageCsv(data: any[][], mappedRegions: { label: string, population: number}[]) {
  const labels = data[0].slice(1);
  const series = data
    .slice(1)
    .map((c) => ({
      label: c[0],
      data: c
        .slice(1)
        .map((r, i) => ({
          t: moment(labels[i], 'YYYY-MM-DD'),
          y: Number(r)
        }))
      }))
    .filter(r => mappedRegions.map(c => c.label).includes(r.label))
    .filter((r, i, a) => a.findIndex(b => b.label === r.label) === i)
    .map(r => {
      const population = mappedRegions.find(c => c.label === r.label)?.population as number;

      return {
        label: r.label,
        data: r.data.map(d => ({
          t: d.t,
          y: d.y / population
        }))
      };
    });

  return series;
}

export class Main extends React.Component<MainProps> {
    
  state = {
    selectedItems: ['Sweden', 'Germany'] as string[],
    group: 'series' as string,
    smooth: '7',
    series: [] as Series[],
    regions: [],
  };

  componentDidMount() {
    Promise.all([axios.get('regions.csv'), axios.get('cases.csv'), axios.get('fatalities.csv')])
      .then((results) => results.map(r => Papa.parse(r.data).data))
      .then(([regions, data, fatalitiesCsv]: [any[][], any[][], any[][]]) => {
        
        const mappedRegions = regions
          .slice(1)
          .map(r => ({
            label: r[0],
            population: Number(r[1]) / 1000000,
          }))
          .filter(r => !['Diamond Princess'].includes(r.label))
          .filter((r, i, a) => a.map(c => c.label).includes(r.label));

        console.log('regions', regions);
        
        const series = massageCsv(data, mappedRegions);
        const fatalities = massageCsv(fatalitiesCsv, mappedRegions);

        this.setState({
          regions: mappedRegions,
          series,
          fatalities,
        });
      });
  }

  render() {
    const offset = 1;

    const group = this.state[this.state.group] as Series[];

    const smoothedSeries = group
      .filter(d => this.state.selectedItems.includes(d.label))
      .map(d => ({
        label: d.label,
        data: d.data.map((r, i) => ({
          t: r.t,
          y: i > offset ? (r.y - d.data[i - offset].y) / offset : NaN
        }))
      }));

    console.log('state', smoothedSeries, this.state);

    return (
      <div style={{ padding: 15, height: window.innerHeight - 100 }}>
        <ResponsiveGridLayout className="layout" rowHeight={30}>
          <FormGroup
            key="group"
            data-grid={{x: 0, y: 0, w: 1, h: 2, static: true}}
            label="Group"
            labelFor="select"
          >
            <div className="bp3-select">
              <select
                value={this.state.group}
                onChange={e => this.setState({ group: e.target.value })}  
              >
                <option value="series">Cases</option>
                <option value="fatalities">Fatalities</option>
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
                <option value={1}>Day</option>
                <option value={2}>2 Days</option>
                <option value={7}>Week</option>
                <option value={14}>2 Weeks</option>
                <option value={30}>Month</option>
                {/* <option value={24}>Two Years</option> */}
                {/* <option value={1000}>Cumulative</option> */}
              </select>
            </div>
          </FormGroup>
          <FormGroup
            data-grid={{x: 2, y: 0, w: 10, h: 2, static: true}}
            key="regions"
            label="Regions"
            labelFor="regions"
          >
            <SelectChartItems
              items={this.state.regions}
              selectedItems={this.state.selectedItems}
              onSelection={selectedItems => this.setState({ selectedItems })}
            />
          </FormGroup>
        </ResponsiveGridLayout>
        <Chart series={smoothedSeries} smooth={+this.state.smooth} slice={150} annotations={this.state.group === 'series'} />
      </div>
    );
  }
}
