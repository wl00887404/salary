const { writeFileSync } = require('fs');
const { zip, last, fromPairs } = require('lodash');

const login = require('./login');
const config = require('../config.json');
const { programs } = config;

const begin = new Date(config.begin).getTime();
const end = new Date(config.end).getTime();

const fetch = async (browser, url) => {
  const page = await browser.newPage();
  const results = [];

  await page.goto(url);

  while (true) {
    const data = await page.$$eval('tr[id^="comment"]', trs =>
      trs.map(tr => {
        const name = tr.querySelector('td:nth-child(1) a').innerText;
        const time = new Date(
          tr.querySelector('td:nth-child(7)').innerText,
        ).getTime();

        return { name, time };
      }),
    );

    results.push(
      ...data
        .filter(
          ({ name, time }) => name == '政治' && begin <= time && time < end,
        )
        .map(({ time }) => new Date(time).toISOString()),
    );

    const nextButton = await page.$('a[rel="next"]');

    if (!nextButton || last(data).time < begin) break;

    nextButton.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  }

  return results;
};

const stringify = value => JSON.stringify(value, null, 2);

const main = async () => {
  const browser = await login();
  const result = await Promise.all(
    programs.map(program => fetch(browser, program.url)),
  );
  writeFileSync(
    './commentsByProgram.json',
    stringify(
      fromPairs(
        zip(programs, result).map(([program, comments]) => [
          program.name,
          comments,
        ]),
      ),
    ),
  );

  browser.close();
};

main();
