import * as React from 'react';
import * as moment from 'moment';
import axios from 'axios';
import Chart from './Chart';

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

// import { defaultGraphStyle, GraphType } from './Chart';
// import {
//   InputGroup,
//   Navbar, 
//   NavbarGroup, 
//   NavbarHeading, 
//   NavbarDivider, 
//   Alignment, 
//   Popover, 
//   Position, 
//   Button, 
// } from '@blueprintjs/core';

interface MainProps {
}

export class Main extends React.Component<MainProps> {
    
  state = {
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

    // Remove duplicates
    const filteredData = this.state.series.map(s => ({
      ...s,
      data: s.data.filter((d1, i) => s.data.findIndex(d2 => d1.t.valueOf() === d2.t.valueOf()) === i)
    }));
    
    return (
      <div style={{ padding: 15 }}>
        <Chart series={filteredData} smooth={12} />
      </div>
    );
  }
}
