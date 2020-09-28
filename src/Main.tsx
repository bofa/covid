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

function massageExcessDeaths(response: any, populationIndex: number, deathsIndex: number) {
  const parsed = Papa.parse(response.data).data as any[][];
  const label = parsed[1][0];

  const data = parsed.slice(1)
    .map(r => ({
      t: moment(r[2], 'DD/MM/YYYY'),
      y: r[deathsIndex] / r[populationIndex] * 1000000
        / (1 + moment(r[3], 'DD/MM/YYYY').diff(moment(r[2], 'DD/MM/YYYY'), 'days')),
    }))
    .filter(d => d.t.isValid && !isNaN(d.y));

  const validation = data.filter(r => r.t.year() < 2020);

  const diffNorm = data.filter(r => r.t.year() >= 2020)
    .map(d1 => ({
      t: d1.t,
      y: d1.y - validation.filter(d2 => Math.abs(d1.t.dayOfYear() - d2.t.dayOfYear()) < 8)
      .map(d => d.y).reduce((sum, y, i, a) => sum + y / a.length, 0)
    }));

  const series: Series = {
    label,
    // data,
    data: diffNorm
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
    regions: [],
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
    this.regions$ = axios.get('regions.csv')
      .then(response => Papa.parse(response.data).data)
      .then((regions: any[][]) => {
        const mappedRegions = regions
          .slice(1)
          .map(r => ({
            label: r[0],
            population: Number(r[1]) / 1000000,
          }))
          .filter(r => !['Diamond Princess'].includes(r.label))
          .filter((r, i, a) => a.map(c => c.label).includes(r.label));

        return mappedRegions;
      });

    this.regions$.then((regions: any) => this.setState({ regions }));

    this.loadCases();  
  }

  loadCases = () => {
    Promise.all([this.regions$, axios.get('cases.csv').then(r => Papa.parse(r.data).data)])
      .then(([mappedRegions, data]: [any, any[][]]) => {
        
        const series = massageCsv(data, mappedRegions)
          .map(d => ({
            label: d.label,
            data: d.data.map((r, i) => ({
              t: r.t,
              y: i > 1 ? (r.y - d.data[i - 1].y) : NaN
            }))
            .filter(v => !isNaN(v.y))
          }));

        // const fatalities = massageCsv(fatalitiesCsv, mappedRegions)
        //   .map(d => ({
        //     label: d.label,
        //     data: d.data.map((r, i) => ({
        //       t: r.t,
        //       y: i > 1 ? (r.y - d.data[i - 1].y) : NaN
        //     }))
        //     .filter(v => !isNaN(v.y))
        //   }));

        this.setState({
          // regions: mappedRegions,
          series,
          // fatalities,
        });
      });
    }

    loadCovidFatalities = () => {
      Promise.all([this.regions$, axios.get('fatalities.csv').then(r => Papa.parse(r.data).data)])
        .then(([mappedRegions, fatalitiesCsv]: [any, any[][]]) => {
  
          const fatalities = massageCsv(fatalitiesCsv, mappedRegions)
            .map(d => ({
              label: d.label,
              data: d.data.map((r, i) => ({
                t: r.t,
                y: i > 1 ? (r.y - d.data[i - 1].y) : NaN
              }))
              .filter(v => !isNaN(v.y))
            }));
  
          this.setState({
            // regions: mappedRegions,
            fatalities,
          });
        });
    }

    loadExcessFatalities = (labels = []) => {
    const baseUrl = 'https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/source-data/';
    [
      [baseUrl + 'sweden/sweden_total_source_latest.csv', 4, 5],
      [baseUrl + 'germany/germany_total_source_latest.csv', 4, 5],
      [baseUrl + 'netherlands/netherlands_total_source_latest.csv', 4, 5],
      // [baseUrl + 'france/france_total_source_latest.csv', 4, 5],
      [baseUrl + 'turkey/turkey_total_source_latest.csv', 4, 5],
      [baseUrl + 'belgium/belgium_total_source_latest.csv', 4, 5],
      [baseUrl + 'norway/norway_total_source_latest.csv', 5, 6],
    ].forEach((params: [string, number, number]) => axios.get(params[0])
      .then(r => massageExcessDeaths(r, params[1], params[2]))
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
      .filter(d => this.state.selectedItems.includes(d.label));
      // .map(d => ({
      //   label: d.label,
      //   data: d.data.map((r, i) => ({
      //     t: r.t,
      //     y: i > offset ? (r.y - d.data[i - offset].y) / offset : NaN
      //   }))
      //   .filter(v => !isNaN(v.y))
      // }));

    // console.log('state', this.state);

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
              labelStepSize={10}
              onChange={slider => this.setState({ slider })}
              // onRelease={}
              value={this.state.slider}
              vertical={false}
            />
          </FormGroup>
        </ResponsiveGridLayout>
        <Chart series={smoothedSeries} smooth={+this.state.smooth} slice={slice} annotations={this.state.group === 'series' && !isNaN(+this.state.smooth)} />
      </div>
    );
  }
}
