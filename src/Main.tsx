// tslint:disable: jsx-alignment

import * as React from 'react';
import * as moment from 'moment';
import axios from 'axios';
import Chart, { Series, smooth } from './Chart';
import { FormGroup, RangeSlider, Spinner } from '@blueprintjs/core';
// import GridLayout from 'react-grid-layout';
import { Responsive, WidthProvider } from 'react-grid-layout';
// const neatCsv = require('neat-csv');
// import csvParse from 'csv-parse';
import * as Papa from 'papaparse';
import { Map } from './Map';

function groupBy(xs: any[][], key: number |  string) {
  const obj = xs
  .filter(row => row.length > 1)
  .reduce(function(rv: any, x: any) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});

  const returnArray = Object.values(obj);

  console.log('returnArray', xs, returnArray);

  return returnArray;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import SelectChartItems from './SelectRegion';
import { getCases, getFatalities } from './scrape';

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

export const xAxisObj = {
  series: 'Cases per day per 1 million',
  fatalities: 'Fatalities per day per 1 million',    
  excess: 'Fatalities per day per 1 million',
  normal: 'Fatalities per day per 1 million',
  positive: '% of testing positive',
  hospital: 'Daily new ICU admissions per 1 million'
};

export class Main extends React.Component<MainProps> {

  regions$: any;

  state = {
    vizType: 'chart',
    selectedItems: ['Sweden', 'Germany'] as string[],
    group: ['series'] as string[],
    smooth: '7',
    series: [] as Series[],
    fatalities: [] as Series[],    
    excess: [] as Series[],
    normal: [] as Series[],
    positive: [] as Series[],
    hospital: [] as Series[],
    slider: [0, 1] as [number, number],
  };

  constructor(props: any) {
    super(props);

    // const localSeries = localStorage.getItem('series');
    
    // if (localSeries) {
    //   this.setState({ series: localSeries });
    // }
  }

  selectViz = (event: React.ChangeEvent<HTMLSelectElement>) => {
    gtag('event', 'Map', {
      'event_category': 'vizType',
    });

    const vizType = event.target.value;

    this.setState({ vizType });
  }

  selectGroup = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const group = event.target.value.split(',');
    // console.log('group', group);

    if (group.includes('series') && this.state.series.length < 1) {
      this.loadCases();
    }
    if (group.includes('fatalities') && this.state.fatalities.length < 1) {
      this.loadCovidFatalities();
    }
    if (group.includes('excess') && this.state.excess.length < 1) {
      this.loadExcessFatalities();
    }
    if (group.includes('normal') && this.state.normal.length < 1) {
      this.loadNormalFatalities();
    }
    if (group.includes('positive') && this.state.positive.length < 1) {
      this.loadPositive();
    }
    if (group.includes('hospital') && this.state.hospital.length < 1) {
      this.loadHospital();
    }

    this.setState({ group });
  }

  componentDidMount() {
    this.loadCases();  
  }

  loadCases = () => {
    gtag('event', 'loadCases', {
      'event_category': 'loadType',
    });

    const time = moment();
    // axios.get('cases.json')
    getCases()
      .then((response: any) => {
        // localStorage.setItem('series', JSON.stringify(response.data));
        console.log('time', moment().valueOf() - time.valueOf());

        this.setState({
          series: response,
        });
      });
  }

  loadCovidFatalities = () => {
    gtag('event', 'loadCovidFatalities', {
      'event_category': 'loadType',
    });

    // axios.get('fatalities.json')
    getFatalities()
      .then((response: any) => {
        this.setState({
          fatalities: response,
        });
      });
  }

  loadPositive = () => {
    gtag('event', 'loadPositive', {
      'event_category': 'loadType',
    });

    axios.get('positive.json')
    // getPositive()
      .then((response: any) => response.data)
      .then((series: any) => {
        this.setState({
          positive: series
            .map((s: any) => ({
              ...s,
              data: s.data.map((d: any) => ({ t: moment(d.t), y: d.y }))
            }))
        });
      });
  }

  loadHospital = () => {
    gtag('event', 'loadHospital', {
      'event_category': 'loadType',
    });

    axios.get('hospital.json')
    // getPositive()
      .then((response: any) => response.data)
      .then((series: any) => {
        this.setState({
          hospital: series
            .map((s: any) => ({
              ...s,
              data: s.data.map((d: any) => ({ t: moment(d.t), y: d.y }))
            }))
        });
      });
  }

  loadExcessFatalities = (labels = []) => {
    gtag('event', 'loadExcessFatalities', {
      'event_category': 'loadType',
    });

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
    // console.log('state', this.state);

    const group = (this.state[this.state.group[0]] as Series[])
    //   .map(s => ({
    //     ...s,
    //     data: smooth(s.data, +this.state.smooth),
    //   }))
      ;

    const smoothedSeries = group
      .filter(s => this.state.selectedItems.includes(s.label))
      .map(s => ({
        ...s,
        data: smooth(s.data, +this.state.smooth),
      }));

    const xAxis = xAxisObj[this.state.group[0]];

    const time = smoothedSeries.map(s => s.data.map(d => d.t.valueOf())).reduce((a, b) => a.concat(b), []);
    const min = Math.min(...time);
    const max = Math.max(...time);

    const slice = this.state.slider.map(value => min + value * (max - min));

    return (
      <div style={{ padding: 10, height: window.innerHeight - 200 }}>
        <ResponsiveGridLayout className="layout" rowHeight={30} cols={{lg: 3, md: 3, sm: 3, xs: 3, xxs: 3}}>
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
                {/* <option value="series,fatalities">Cases & Fatalities</option> */}
                <option value="positive">Testing Positive Rate</option>
                <option value="hospital">ICU Admissions</option>
                <option value="excess">Excess Fatalities</option>
                <option value="normal">Total Fatalities</option>
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
            key="visualtype"
            data-grid={{x: 2, y: 0, w: 1, h: 2, static: true}}
            label="Viz Type"
            labelFor="select"
          >
            <div className="bp3-select">
              <select
                value={this.state.vizType}
                onChange={this.selectViz}  
              >
                <option value="chart">Chart</option>
                <option value="map">Map</option>
              </select>
            </div>
          </FormGroup>
        </ResponsiveGridLayout>
        {this.state.vizType === 'map'
          ? null
          : [<FormGroup
            data-grid={{x: 3, y: 0, w: 5, h: 2, static: true}}
            key="regions"
            label="Regions"
            labelFor="regions"
          >
            <SelectChartItems
              smooth={this.state.smooth}
              items={group}
              selectedItems={this.state.selectedItems}
              onSelection={selectedItems => this.setState({ selectedItems })}
            />
          </FormGroup>,
          <FormGroup key="slider">
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
        ]}
        {group.length > 0
          ? this.state.vizType === 'map' ? <Map
            width={window.innerWidth}
            height={window.innerHeight - 200}
            series={group}
            smooth={+this.state.smooth}
          />
          : <Chart
              series={smoothedSeries}
              smooth={+this.state.smooth}
              slice={slice}
              xAxis={xAxis}
              annotations={this.state.group.includes('series') && !isNaN(+this.state.smooth)}
          />
          : <Spinner/>
        }
      </div>
    );
  }
}
