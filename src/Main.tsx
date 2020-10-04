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

const groupBy = function(xs: any[][], key: number |  string) {
  const obj = xs
  .filter(row => row.length > 1)
  .reduce(function(rv: any, x: any) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});

  const returnArray = Object.values(obj);

  console.log('returnArray', xs, returnArray);

  return returnArray;
};

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

function massageExcessDeaths(response: any, parseIndex: number = 11) {
  const parsed = Papa.parse(response.data).data as any[][];
  const label = parsed[1][0];

  const data = parsed.slice(1)
    .map(r => ({
      t: moment(r[4]),
      y: r[parseIndex] / r[7] * 1000000
        / (1 + moment(r[4]).diff(moment(r[3]), 'days')),
    }))
    .filter(d => d.t.isValid && !isNaN(d.y));

  const series: Series = {
    label,
    data,
    total: data.reduce((sum, d) => sum + d.y, 0),
  };

  return series;
}

function massageNormalDeaths(response: any, populationIndex: number, deathsIndex: number) {
  const parsed = Papa.parse(response.data).data as any[][];
  // const label = parsed[1][0];

  const grouped = groupBy(parsed.slice(1), 1) as any[][];

  const dataGroups = grouped.map(g => ({
    label: g[0][1],
    data: g.map(r => ({
      t: moment(r[2], 'DD/MM/YYYY'),
      y: r[deathsIndex] / r[populationIndex] * 1000000
        / (1 + moment(r[3], 'DD/MM/YYYY').diff(moment(r[2], 'DD/MM/YYYY'), 'days')),
    }))
    .filter(d => d.t.isValid && !isNaN(d.y))
  }));

  // const validation = data.filter(r => r.t.year() < 2020);
  // const diffNorm = data.filter(r => r.t.year() >= 2020)
  //   .map(d1 => ({
  //     t: d1.t,
  //     y: d1.y - validation.filter(d2 => Math.abs(d1.t.dayOfYear() - d2.t.dayOfYear()) < 8)
  //     .map(d => d.y).reduce((sum, y, i, a) => sum + y / a.length, 0)
  //   }));

  const series: Series[] = dataGroups.map(g => ({
    label: g.label,
    data: g.data,
    total: g.data.reduce((sum, d) => sum + d.y, 0),
  }));

  return series;
}

const xAxisObj = {
  series: 'Cases per day per 1 million',
  fatalities: 'Fatalities per day per 1 million',    
  excess: 'Fatalities per day per 1 million',
  normal: 'Fatalities per day per 1 million',
};

export class Main extends React.Component<MainProps> {

  regions$: any;

  state = {
    selectedItems: ['Sweden', 'Germany'] as string[],
    group: 'series' as 'series' | 'fatalities' | 'excess' | 'normal',
    smooth: '7',
    series: [] as Series[],
    fatalities: [] as Series[],    
    excess: [] as Series[],
    normal: [] as Series[],
    slider: [0, 1] as [number, number],
  };

  selectGroup = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const group = event.target.value as 'series' | 'fatalities' | 'excess' | 'normal';

    if (group === 'series' && this.state.series.length < 1) {
      this.loadCases();
    } else if (group === 'fatalities' && this.state.fatalities.length < 1) {
      this.loadCovidFatalities();
    } else if (group === 'excess' && this.state.excess.length < 1) {
      this.loadExcessFatalities();
    } else if (group === 'normal' && this.state.normal.length < 1) {
      this.loadNormalFatalities();
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
      'sweden', 'germany', 'netherlands', 'turkey', 'belgium', 'norway', 'portugal', 'russia', 'austria', 'denmark', 'south_africa', 'switzerland'
      // 'france', 'spain', 'chile'
    ].forEach(label => axios.get(baseUrl + label + endUrl)
      .then(r => {
        this.setState({
          excess: this.state.excess.concat(massageExcessDeaths(r)),
        });
      })
    );
  }

  loadNormalFatalities = (labels = []) => {
    // tslint:disable-next-line: max-line-length
    // const baseUrl = 'https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/source-data/';
    // const baseUrl = 'https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/output-data/excess-deaths/';
    // const endUrl = '_excess_deaths.csv';

    // https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/source-data/

    const baseUrl = 'https://raw.githubusercontent.com/TheEconomist/covid-19-excess-deaths-tracker/master/source-data/';
    [
      // [baseUrl + 'france/france_total_source_latest.csv', 4, 5],
      ['sweden/sweden_total_source_latest.csv', 4, 5],
      ['germany/germany_total_source_latest.csv', 4, 5],
      ['netherlands/netherlands_total_source_latest.csv', 4, 5],
      ['turkey/turkey_total_source_latest.csv', 4, 5],
      ['belgium/belgium_total_source_latest.csv', 4, 5],
      ['norway/norway_total_source_latest.csv', 5, 6],
      // ['israel/israel_total_source_latest.csv', 7, 6],
      // ['united-states/united_states_total_source_latest.csv', 4, 6]
    ].forEach((params: [string, number, number]) => axios.get(baseUrl + params[0])
      .then(r => massageNormalDeaths(r, params[1], params[2]))
      .then(series => {
        this.setState({
          normal: this.state.normal.concat(series)
        });
      })
    );

    // [
    //   'sweden', 'germany', 'netherlands', 'turkey', 'belgium', 'norway',
    // 'portugal', 'russia', 'austria', 'denmark', 'south_africa', 'switzerland'
    //   // 'france', 'spain', 'chile'
    // ].forEach(label => axios.get(baseUrl + label + endUrl)
    //   .then(r => {
    //     this.setState({
    //       normal: this.state.excess.concat(massageExcessDeaths(r)),
    //     });
    //   })
    // );
  }

  render() {

    const group = this.state[this.state.group] as Series[];
    const xAxis = xAxisObj[this.state.group];

    const smoothedSeries = group
      .filter(s => this.state.selectedItems.includes(s.label))
      .map(s => ({
        ...s,
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
                <option value="normal">Normal Fatalities</option>
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
          xAxis={xAxis}
          annotations={this.state.group === 'series' && !isNaN(+this.state.smooth)}
        />
      </div>
    );
  }
}
