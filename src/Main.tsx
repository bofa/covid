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

const countryParams = [
  {
    label: 'Sweden',
    polulation: 10,
  },
  {
    label: 'Germany',
    population: 80,
  }
];

const ResponsiveGridLayout = WidthProvider(Responsive);

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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

export class Main extends React.Component<MainProps> {
    
  state = {
    group: 'models' as string,
    smooth: 1,
    series: [] as Series[],
  };

  constructor(props: MainProps) {
    super(props);

    // 1JRY_Ge9cS0AVgSQ1NcCgb7zXL_bKuKxug-2buM3pgWI
    
    // axios
    // .get('https://docs.google.com/spreadsheets/d/e/
    // 2PACX-1vR69RO9V00Rkd9dJrD8hxW4B86D1Mdq3yLSm1_67pUhjQcys6lXeu0tGkjTCP4gRi5Ez06ZDkFrPSDF/pub?output=csv')
    //   .then(reponse => console.log('response', reponse.data));

    // axios.get('https://yacdn.org/serve/https://datagraver.com/corona/data/cases.csv?time=1600861091380')
    //   .then(reponse => console.log('gurkburk', reponse));

    axios
      .get('cases.csv')
      .then(r => Papa.parse(r.data).data)
      .then((data: any[][])  => {
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
            .filter(r => countryParams.map(c => c.label).includes(r.label));

        this.setState({ series });

        console.log('sweden?', data, series);
      });
      // .then(arg => console.log('arg', csvParse(arg.data, undefined, (data) => console.log('done', data))));
    //   .then(response => {
    //     const dataObj = response.data.feed.entry;
    //     //   .map((row: any) => [row.title['$t'],
    //     //     // convertArrayToObject(
    //     //       row.content['$t']
    //     //       .replace(/ /g, '')
    //     //       // .split(' ').join()
    //     //       .split(',')
    //     //       .map((r: any) => r.split(':'))
    //     //       .map((r: any) => [r[0], Number(r[1])])
    //     //       .filter((r: any) => !isNaN(r[1]))
    //     //     // , 0)
    //     //   ])
    //     //   .reduce((acc: { [x: string]: { t: any; y: any; }[]; }, [date, cars]: any) => {
    //     //     cars.forEach(([id, sales]: any[]) => {
    //     //       const input = { t: moment(date), y: sales };
    //     //       if (acc[id] === undefined) {
    //     //         acc[id] = [input];
    //     //       } else {
    //     //         acc[id].push(input);
    //     //       }
              
    //     //       return acc;
    //     //     });

    //     //     return acc;
    //     //   }, {})
    //     //   ;

    //     // const dataList = Object.keys(dataObj).map(key => ({
    //     //   label: key,
    //     //   data: dataObj[key],
    //     // }));

    //     // this.setState({
    //     //   series: dataList
    //     // });

    //     console.log('response.data', response.data);
    //     console.log('response', dataObj);
    //   });

  }

  render() {

    const offset = 1;

    const smoothedSeries = this.state.series.map(d => ({
      label: d.label,
      data: d.data.map((r, i) => ({
        t: r.t,
        y: i > offset ? (r.y - d.data[i - offset].y) / offset : NaN
      }))
    }));

    // console.log('smoothedSeries', this.state.series, smoothedSeries);

    return (
      <div style={{ padding: 15, height: window.innerHeight - 100 }}>
        <ResponsiveGridLayout className="layout" rowHeight={30}>
          <FormGroup
            data-grid={{x: 0, y: 0, w: 1, h: 2, static: true}}
            key="group"
            label="Group"
            labelFor="group"
          >
            <div className="bp3-select">
              <select
                value={this.state.group}
                onChange={e => this.setState({ group: e.target.value })}  
              >
                <option value="models">Sweden Models</option>
                <option value="segment">Sweden Segment</option>
                <option value="norway">Norway</option>
                <option value="netherlands">Netherlands</option>
                <option value="spain">Spain</option>
              </select>
            </div>
          </FormGroup>
          <FormGroup
            key="smoothing"
            data-grid={{x: 1, y: 0, w: 1, h: 2, static: true}}
            label="Smoothing"
            helperText="Interval too accumulate over"
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
                <option value={30}>Month</option>
                {/* <option value={24}>Two Years</option> */}
                <option value={1000}>Cumulative</option>
              </select>
            </div>
          </FormGroup>
        </ResponsiveGridLayout>
        <Chart series={smoothedSeries} smooth={this.state.smooth} slice={200} />
      </div>
    );
  }
}
