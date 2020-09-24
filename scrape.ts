const axios = require('axios');
const moment = require('moment');
const fs = require('fs').promises;

axios.get('https://datagraver.com/corona/data/cases.csv?time=1600930826640')
  .then((response: any) => fs.writeFile('public/cases.csv', response.data))
  .then(() => console.log('Scrape Done'));