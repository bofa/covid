const axios = require('axios');
const moment = require('moment');
// const fs = require('fs').promises;
const Papa = require('papaparse');

const baseUrl = 'https://raw.githubusercontent.com/Datagraver/Covid-19-base/main/';
const afterMs = moment('2020-03-01').valueOf();

function notEmpty<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) {
    return false;
  }
  
  return true;
}

// function hashString (input: string) {
//   var hash = 0, i, chr;
//   for (i = 0; i < input.length; i++) {
//     chr   = input.charCodeAt(i);
//     // tslint:disable-next-line: no-bitwise
//     hash  = ((hash << 5) - hash) + chr;
//     // tslint:disable-next-line: no-bitwise
//     hash |= 0; // Convert to 32bit integer
//   }
//   return hash;
// }

// interface Series {
//   label: string;
//   data: { t: any, y: number }[];
// }

function massageCsv(csv: any[][], mappedRegions: { label: string, population: number}[]) {
  const labels = csv[0].slice(1);
  const series = csv
    .slice(1)
    .filter((r, i, a) => a.findIndex(b => b[0] === r[0]) === i)
    .map((c) => {
      const label = c[0];
      const population = mappedRegions.find(region => region.label === label)?.population as number;
      
      if (population < 0.1) {
        return null;
      }

      const data = c
        .slice(1)
        .map((r, i) => ({
          t: moment(labels[i], 'YYYY-MM-DD'),
          y: Number(r) / population
        }))
        .filter(v => v.t > afterMs)
        .map((r, i, a) => ({
          t: r.t,
          y: i > 1 ? (r.y - a[i - 1].y) : NaN
        }))
        .filter(v => !isNaN(v.y));
      // console.log(label, population);

      return {
        label,
        data, 
        total: data.reduce((sum: number, d: any) => sum + d.y, 0),
      };
    })
    .filter(notEmpty)
    ;

  return series;
}

// function massageExcessDeaths(response: any, populationIndex: number, deathsIndex: number) {
//   const parsed = Papa.parse(response.data).data as any[][];
//   const label = parsed[1][0];

//   const data = parsed.slice(1)
//     .map(r => ({
//       t: moment(r[2], 'DD/MM/YYYY'),
//       y: r[deathsIndex] / r[populationIndex] * 1000000
//         / (1 + moment(r[3], 'DD/MM/YYYY').diff(moment(r[2], 'DD/MM/YYYY'), 'days')),
//     }))
//     .filter(d => d.t.isValid && !isNaN(d.y));

//   const validation = data.filter(r => r.t.year() < 2020);

//   const diffNorm = data.filter(r => r.t.year() >= 2020)
//     .map(d1 => ({
//       t: d1.t,
//       y: d1.y - validation.filter(d2 => Math.abs(d1.t.dayOfYear() - d2.t.dayOfYear()) < 8)
//       .map(d => d.y).reduce((sum, y, i, a) => sum + y / a.length, 0)
//     }));

//   const series: Series = {
//     label,
//     // data,
//     data: diffNorm
//   };

//   return series;
// }

// export function get

const regions$ = axios.get(baseUrl + 'regions.csv')
  .then((response: any) => Papa.parse(response.data).data)
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

export function getCases() {
  // const cases$ = axios.get(baseUrl + 'cases.csv')
  //   .then((reponse: any) => {
  //     const hash = '' + hashString(JSON.stringify(reponse.data));
  //     const storage = localStorage.getItem(hash);

  //     if (storage) {
  //       return [true, JSON.parse(storage)];
  //     }

  //     const papa = Papa.parse(reponse.data).data;
  //     localStorage.setItem(hash, JSON.stringify(papa));

  //     return [false, papa];
  //   });

  return Promise.all([
    regions$,
    axios.get(baseUrl + 'cases.csv'),
  ])
  .then(([mappedRegions, response]: [any, any]) => {
    // const hash = sha256(JSON.stringify(response.data));
    // const storage = localStorage.getItem(hash);

    // if (storage) {
    //   return JSON.parse(storage);
    // }

    const data = Papa.parse(response.data).data;

    const series = massageCsv(data, mappedRegions)
      // .map(s => ({ ...s, total: s.data.reduce((sum: number, d: any) => sum + d.y, 0)}))
      .filter(s => s.total > 1)
      ;

    // let jsonString = JSON.stringify(series);
    // const step = 1e7;
    // let i = 0;
    // while (jsonString.length > 0) {
    //   localStorage.setItem(hash + i, jsonString.slice(0, 1 * step));
    //   jsonString = jsonString.slice(1 * step + 1);
    //   i += 1;    
    // }

    // console.log('series', );
    // localStorage.setItem(hash, json2);

    return series;
  });
}

export function getFatalities() {
  return Promise.all([
      regions$,
      axios.get(baseUrl + 'fatalities.csv').then((r: any) => Papa.parse(r.data).data)]
    ).then(([mappedRegions, fatalitiesCsv]: [any, any[][]]) => {

    const fatalities = massageCsv(fatalitiesCsv, mappedRegions)
      // .map(s => ({ ...s, total: s.data.reduce((sum: number, d: any) => sum + d.y, 0)}))
      .filter(s => s.total > 1);

    return fatalities;
    });
}

// export function getPositive() {
//   return axios.get('https://opendata.ecdc.europa.eu/covid19/testing/json/')
//     .then((response: any) => response.data)
//     .then((data: any) => groupBy(data, 'country')
//       .map((s: any[]) => ({
//         total: s[s.length - 1].positivity_rate,
//         label: s[0].country,
//         data: s
//           .map((d: any) => ({ t: moment(d.year_week), y: d.positivity_rate }))
//           .filter(d => !isNaN(d.y))}))
//     );
// }
