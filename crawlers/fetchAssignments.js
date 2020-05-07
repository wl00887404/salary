const { readFileSync, writeFileSync } = require('fs');
const { flattenDeep } = require('lodash');

const login = require('./login');
const config = require('../config.json');

const begin = new Date(config.begin).getTime();
const end = new Date(config.end).getTime();
const raw = readFileSync('./assignments.csv', { encoding: 'utf-8' });

const parseLine = raw => {
  const results = [];
  let result = '';
  let hasQuotation = false;

  for (let i = 0; i < raw.length; i++) {
    if (hasQuotation) {
      if (raw[i] == '"') {
        hasQuotation = false;
      } else {
        result += raw[i];
      }
    } else {
      if (raw[i] == '"') {
        hasQuotation = true;
      } else if (raw[i] == ',') {
        results.push(result);
        result = '';
      } else {
        result += raw[i];
      }
    }
  }

  return results;
};

const urls = raw
  .split('\n')
  .filter(line => line.includes('政治'))
  .map(line => {
    const columns = parseLine(line);
    const cohort = parseInt(columns[0]);
    const time = new Date(`${columns[2]} ${columns[3]}`).getTime();
    const url = columns[5];

    return { cohort, time, url };
  })
  .filter(({ cohort }) => cohort == config.cohort)
  .map(({ url }) => url);

const fetch = async (browser, url) => {
  const page = await browser.newPage();

  await page.goto(url);

  const results = await page.$$eval('li[id^="comment"]', lis =>
    lis.map(li => {
      const name = li.querySelector('.name a').innerHTML;
      const time = new Date(li.querySelector('.time a').innerHTML).getTime();

      return { name, time };
    }),
  );

  return results;
};

const stringify = value => JSON.stringify(value, null, 2);

const main = async () => {
  const browser = await login();
  const results = await Promise.all(urls.map(url => fetch(browser, url)));

  writeFileSync(
    './assignments.json',
    stringify(
      flattenDeep(results)
        .filter(
          ({ name, time }) => name == '政治' && begin <= time && time < end,
        )
        .map(({ time }) => new Date(time).toISOString()),
    ),
  );

  browser.close();
};

main();
