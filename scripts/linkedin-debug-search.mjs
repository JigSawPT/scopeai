import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent('Chris Frantz Loops'), {
  waitUntil: 'domcontentloaded', timeout: 30000
});
await page.waitForTimeout(6000);
console.log('url:', page.url());

// Dismiss any prompt
await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /continuar com a versão web/i.test((x.textContent || '').trim()));
  if (b) b.click();
});
await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/in/"]'))
    .map(l => l.getAttribute('href'))
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .slice(0, 10);
  const bodyText = document.body.innerText.slice(0, 500);
  return { links, bodyText };
});
console.log('in/ links:', JSON.stringify(info.links));
console.log('body:', JSON.stringify(info.bodyText.slice(0, 300)));

await browser.close();
