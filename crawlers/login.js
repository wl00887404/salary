const puppeteer = require('puppeteer');

const login = async headless => {
  const browser = await puppeteer.launch({ headless });
  const page = (await browser.pages())[0];

  await page.goto('https://lighthouse.alphacamp.co/users/sign_in');
  await page.type('#user_email', 'wl00887404@gmail.com');
  await page.type('#user_password', 'u4f55u632fu5fd7');
  page.click('input[value="登入"]');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  return browser;
};

module.exports = login;
