const { writeFileSync } = require('fs');
const { flattenDeep, last } = require('lodash');

const login = require('./login');
const config = require('../config.json');
const extraURLs = require('../extraAssignmentURLs.json');

const begin = new Date(config.begin).getTime();
const end = new Date(config.end).getTime();

const fetchUrls = async browser => {
  const page = await browser.newPage();
  const results = [];

  await page.goto(
    'https://lighthouse.alphacamp.co/console/answer_lists?program_id=39&status=replied',
  );

  while (true) {
    const data = await page.$$eval('tr[id^="answer"]', trs =>
      trs.map(tr => {
        const time = new Date(
          tr.querySelector('td:nth-child(2)').innerText,
        ).getTime();
        const url = tr.querySelector('td:nth-child(3) a').href;

        return { url, time };
      }),
    );

    results.push(
      data
        .filter(({ time }) => begin <= time && time < end)
        .map(({ url }) => url),
    );

    const nextButton = await page.$('a[rel="next"]');

    if (!nextButton || last(data).time < begin) break;

    nextButton.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  }

  return [...results, ...extraURLs];
};

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
  const urls = flattenDeep(await fetchUrls(browser));
  const results = flattenDeep(
    await Promise.all(urls.map(url => fetch(browser, url))),
  );

  writeFileSync(
    './assignments.json',
    stringify(
      results
        .filter(
          ({ name, time }) => name == '政治' && begin <= time && time < end,
        )
        .map(({ time }) => new Date(time).toISOString()),
    ),
  );

  browser.close();
};

main();
