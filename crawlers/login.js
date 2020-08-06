const puppeteer = require('puppeteer');
const { account, password } = require('../auth.json');

const login = async headless => {
  const browser = await puppeteer.launch({ headless });
  const page = (await browser.pages())[0];

  await page.goto('https://lighthouse.alphacamp.co/users/sign_in');
  await page.type('#user_email', account);
  await page.type('#user_password', password);
  page.click('input[value="登入"]');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  return browser;
};

module.exports = login;
