const { writeFileSync } = require('fs');
const { zip } = require('lodash');
const login = require('./login');

const config = require('../config.json');

const { targets } = config;
const begin = new Date(config.begin).getTime();
const end = new Date(config.end).getTime();

const fetch = async (browser, url) => {
  const page = await browser.newPage();
  const results = [];

  await page.goto(url);

  while (true) {
    const data = await page.$$eval('tr[id^="comment"]', trs =>
      trs.map(tr => {
        const id = tr.querySelector('td:nth-child(1) a').innerText;
        const time = new Date(
          tr.querySelector('td:nth-child(7)').innerText,
        ).getTime();

        return { id, time };
      }),
    );

    results.push(
      ...data
        .filter(({ id, time }) => id == '政治' && begin <= time && time < end)
        .map(({ time }) => new Date(time).toISOString()),
    );

    const nextButton = await page.$('a[rel="next"]');

    if (!nextButton || data[data.length - 1].time < begin) break;

    nextButton.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  }

  return results;
};

const stringify = value => JSON.stringify(value, null, 2);

const main = async () => {
  const browser = await login();
  const times = await Promise.all(
    targets.map(target => fetch(browser, target.url)),
  );

  writeFileSync(
    './comments.json',
    stringify(
      zip(targets, times).map(([target, time]) => ({
        name: target.name,
        time,
      })),
    ),
  );

  browser.close();
};

main();
