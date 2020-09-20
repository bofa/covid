import * as React from 'react';
import * as moment from 'moment';
import axios from 'axios';
import Chart, { Series } from './Chart';
import { FormGroup } from '@blueprintjs/core';
// import GridLayout from 'react-grid-layout';
import { Responsive, WidthProvider } from 'react-grid-layout';

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

export function massageJson (urls: string[]) {
  // https://eu-evs.com/get_overall_stats_for_charts.php?year=2020&quarter=0&country=Norway

  return Promise.all(urls.map(url => axios.get(url)))
    .then(r => { console.log('r', r); return r; })
    .then((response: any[]) => response.reduce((a, b) => a.concat(b.data), []))
    .then(data => data as { BRAND: string, DATE: string, QUANTITY: string }[])
    .then(data => data
      .map(d => ({
        t: moment(d.DATE),
        y: Number(d.QUANTITY),
        g: d.BRAND,
        month: moment(d.DATE).startOf('month').valueOf()
      }))
      .sort((d1, d2) => d1.t.valueOf() - d2.t.valueOf())
      // Group by brand
      .reduce((acc: { [x: string]: { t: any; y: any; }[]; }, v) => {
        if (acc[v.g] === undefined) {
          acc[v.g] = [v];
        } else {
          acc[v.g].push(v);
        }

        return acc;
      }, {}))
    .then((data: any) => Object.keys(data).map(key => ({
      label: key,
      data: data[key]
      .reduce((acc: any[], v: any) => {
        if (acc.length === 0 || acc[acc.length - 1].month !== v.month) {
          acc.push(v);
        } else {
          acc[acc.length - 1].y += v.y;
        }

        return acc;
      }, []),
    })));
}

// https://docs.google.com/spreadsheets/d/1l50qi3FAue2zqMOtc-vdGbXBWpb0I4lKByqUaz2nuFs/edit?usp=sharing

interface MainProps {
}

export class Main extends React.Component<MainProps> {
    
  state = {
    group: 'models' as string,
    smooth: 12,
    series: [] as Series[],
    norway: [] as Series[],
    netherlands: [] as Series[],
    spain: [] as Series[],
  };

  constructor(props: MainProps) {
    super(props);

    // [
    //   {
    //     "BRAND": "NISSAN",
    //     "DATE": "2020-01-01",
    //     "QUANTITY": "5"
    // },

    massageJson(['norway2018.json', 'norway2019.json', 'norway2020.json'])
      .then(norway => this.setState({ norway }));

    massageJson(['netherlands2018.json', 'netherlands2019.json', 'netherlands2020.json'])
      .then(netherlands => this.setState({ netherlands }));

    massageJson(['spain2018.json', 'spain2019.json', 'spain2020.json'])
      .then(spain => this.setState({ spain }));

    axios
      .get('https://spreadsheets.google.com/feeds/list/1l50qi3FAue2zqMOtc-vdGbXBWpb0I4lKByqUaz2nuFs/1/public/basic?alt=json')
      .then(response => {
        const dataObj = response.data.feed.entry
          .map((row: any) => [row.title['$t'],
            // convertArrayToObject(
              row.content['$t']
              .replace(/ /g, '')
              // .split(' ').join()
              .split(',')
              .map((r: any) => r.split(':'))
              .map((r: any) => [r[0], Number(r[1])])
              .filter((r: any) => !isNaN(r[1]))
            // , 0)
          ])
          .reduce((acc: { [x: string]: { t: any; y: any; }[]; }, [date, cars]: any) => {
            cars.forEach(([id, sales]: any[]) => {
              const input = { t: moment(date), y: sales };
              if (acc[id] === undefined) {
                acc[id] = [input];
              } else {
                acc[id].push(input);
              }
              
              return acc;
            });

            return acc;
          }, {})
          ;

        const dataList = Object.keys(dataObj).map(key => ({
          label: key,
          data: dataObj[key],
        }));

        this.setState({
          series: dataList
        });

        console.log('response.data', response.data);
        console.log('response', dataObj, dataList);
      });
  }

  render() {

    let filteredData: Series[] = [];
    let remove: (label: string) => boolean = () => true;
    switch (this.state.group) {
      case 'models': 
        remove = (label: string) => !['total', 'totalnonebev', 'totalbev'].includes(label);
        filteredData = this.state.series
          .filter(({ label }) => label !== 'total' && remove(label))
            .map(s => ({
              ...s,
              data: s.data
            }));
        break;
      case 'segment': 
        remove = (label: string) => ['total', 'totalnonebev', 'totalbev'].includes(label); 
        filteredData = this.state.series
          .filter(({ label }) => label !== 'total' && remove(label))
            .map(s => ({
              ...s,
              data: s.data
            })); 
        break;
      case 'norway':
        filteredData = this.state.norway;
        break;
      case 'netherlands':
        filteredData = this.state.netherlands;
        break;
      case 'spain':
        filteredData = this.state.spain;
        break;
      default: break;
    }

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
                <option value={1}>Month</option>
                <option value={3}>Quater</option>
                <option value={6}>Half Year</option>
                <option value={12}>Year</option>
                <option value={24}>Two Years</option>
                <option value={1000}>Cumulative</option>
              </select>
            </div>
          </FormGroup>
        </ResponsiveGridLayout>
        <Chart series={filteredData} smooth={this.state.smooth} />
      </div>
    );
  }
}
