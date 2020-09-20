import * as React from 'react';
import * as moment from 'moment';
import axios from 'axios';
import Chart from './Chart';
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

// https://docs.google.com/spreadsheets/d/1l50qi3FAue2zqMOtc-vdGbXBWpb0I4lKByqUaz2nuFs/edit?usp=sharing

interface MainProps {
}

export class Main extends React.Component<MainProps> {
    
  state = {
    group: 'models' as 'models' | 'segment',
    smooth: 12,
    series: [] as { label: string, data: { t: moment.Moment, y: number }[]}[]
  };

  constructor(props: MainProps) {
    super(props);

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
              }
              
              return acc[id].push(input);
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

    let remove: (label: string) => boolean = () => true;
    switch (this.state.group) {
      case 'models': remove = (label: string) => !['total', 'totalnonebev', 'totalbev'].includes(label); break;
      case 'segment': remove = (label: string) => ['total', 'totalnonebev', 'totalbev'].includes(label); break;
      default: break;
    }

    // Remove duplicates
    const filteredData = this.state.series
    .filter(({ label }) => label !== 'total' && remove(label))
      .map(s => ({
        ...s,
        data: s.data.filter((d1, i) => s.data.findIndex(d2 => d1.t.valueOf() === d2.t.valueOf()) === i)
      }));

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
                <option value="models">Models</option>
                <option value="segment">Segment</option>
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

    return (
      <div style={{ padding: 15, height: window.innerHeight - 100 }}>
        <FormGroup
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
        <FormGroup
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
        <Chart series={filteredData} smooth={this.state.smooth} />
      </div>
    );
  }
}
