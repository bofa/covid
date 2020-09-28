const axios = require('axios');
const moment = require('moment');
const fs = require('fs').promises;

axios.get('https://datagraver.com/corona/data/regions.csv?time=1601023648708')
  .then((response: any) => fs.writeFile('public/regions.csv', response.data))
  .then(() => console.log('Regions Done'));

axios.get('https://datagraver.com/corona/data/cases.csv?time=1600930826640')
  .then((response: any) => fs.writeFile('public/cases.csv', response.data))
  .then(() => console.log('Cases Done'));

axios.get('https://datagraver.com/corona/data/fatalities.csv?time=1601023649000')
  .then((response: any) => fs.writeFile('public/fatalities.csv', response.data))
  .then(() => console.log('Fatalities Done'));
