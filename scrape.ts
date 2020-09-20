const axios = require('axios');
const moment = require('moment');
const fs = require('fs').promises;
const norway2018 = require('./raw/norway2018');
const norway2019 = require('./raw/norway2019');
const netherlands2018 = require('./raw/netherlands2018');
const netherlands2019 = require('./raw/netherlands2019');
const spain2018 = require('./raw/spain2018');
const spain2019 = require('./raw/spain2019');

function massageJson (urls: string[], jsonData: any[]) {
    // https://eu-evs.com/get_overall_stats_for_charts.php?year=2020&quarter=0&country=Norway
  
    return Promise.all(urls.map(url => axios.get(url)))
    //   .then(r => { console.log('r', r); return r; })
      .then((response: any[]) => response.reduce((a, b) => a.concat(b.data), []).concat(jsonData))
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
      .then((data: any) => Object.keys(data)
        .map(key => ({
            label: key,
            data: data[key]
                .reduce((acc: any[], v: any) => {
                if (acc.length === 0 || acc[acc.length - 1].month !== v.month) {
                    acc.push(v);
                } else {
                    acc[acc.length - 1].y += v.y;
                }
        
                return acc;
                }, [])
        }))
        .filter((s: any) => s.data.reduce((sum: number, v: any) => sum + v.y, 0) > 500)
      );
}

// console.log('norway2018', norway2018);

const norway$ = massageJson(
    ['https://eu-evs.com/get_overall_stats_for_charts.php?year=2020&quarter=0&country=Norway'],
    norway2018.concat(norway2019))
    .then(data => fs.writeFile('public/norway.json', JSON.stringify(data)))
    .then(() => console.log('Done Norway'));

const netherlands$ = massageJson(
    ['https://eu-evs.com/get_overall_stats_for_charts.php?year=2020&quarter=0&country=Netherlands'],
    netherlands2018.concat(netherlands2019))
    .then(data => fs.writeFile('public/netherlands.json', JSON.stringify(data)))
    .then(() => console.log('Done Netherlands'));

const spain$ = massageJson(
    ['https://eu-evs.com/get_overall_stats_for_charts.php?year=2020&quarter=0&country=Spain'],
    spain2018.concat(spain2019))
    .then(data => fs.writeFile('public/spain.json', JSON.stringify(data)))
    .then(() => console.log('Done Spain'));
