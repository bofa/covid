const axios = require('axios');
const moment = require('moment');
const fs = require('fs').promises;
const Papa =  require('papaparse');

interface Series {
  label: string;
  data: { t: any, y: number }[];
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
    // .filter(r => mappedRegions.map(c => c.label).includes(r.label))
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

const regions$ = axios.get('https://datagraver.com/corona/data/regions.csv?time=1601023648708')
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

Promise.all([
    regions$,
    axios.get('https://datagraver.com/corona/data/cases.csv?time=1600930826640').then((r: any) => Papa.parse(r.data).data)
  ])
  .then(([mappedRegions, data]: [any, any[][]]) => {

    const series = massageCsv(data, mappedRegions)
      .map(d => ({
        label: d.label,
        data: d.data.map((r, i) => ({
          t: r.t,
          y: i > 1 ? (r.y - d.data[i - 1].y) : NaN
        }))
        .filter(v => !isNaN(v.y))
      }))
      .map(s => ({ ...s, total: s.data.reduce((sum: number, d: any) => sum + d.y, 0)}));

    return series;
  })
  .then(data => fs.writeFile('public/cases.json', JSON.stringify(data)))
  .then(() => console.log('Cases Done'));

Promise.all([
  regions$,
  axios.get('https://datagraver.com/corona/data/fatalities.csv?time=1601023649000').then((r: any) => Papa.parse(r.data).data)]
).then(([mappedRegions, fatalitiesCsv]: [any, any[][]]) => {

  const fatalities = massageCsv(fatalitiesCsv, mappedRegions)
    .map(d => ({
      label: d.label,
      data: d.data.map((r, i) => ({
        t: r.t,
        y: i > 1 ? (r.y - d.data[i - 1].y) : NaN
      }))
      .filter(v => !isNaN(v.y))
    }))
    .map(s => ({ ...s, total: s.data.reduce((sum: number, d: any) => sum + d.y, 0)}));

  return fatalities;
  })
  .then(data => fs.writeFile('public/fatalities.json', JSON.stringify(data)))
  .then(() => console.log('Fatalities Done'));
