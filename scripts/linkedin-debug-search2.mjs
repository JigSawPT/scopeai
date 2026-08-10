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

await page.goto('https://www.linkedin.com/search/results/people/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// Dismiss app prompt
await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /continuar com a versão web/i.test((x.textContent || '').trim()));
  if (b) b.click();
});
await page.waitForTimeout(2000);

// Find search input
const inputInfo = await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const inputs = Array.from(document.querySelectorAll('input')).filter(vis);
  return inputs.map(i => ({ ph: i.getAttribute('placeholder'), aria: i.getAttribute('aria-label'), type: i.type })).slice(0, 8);
});
console.log('inputs:', JSON.stringify(inputInfo));

// Type into the search box
const typed = await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const input = Array.from(document.querySelectorAll('input')).find(x => vis(x) && (/pesquisar|search/i.test(x.getAttribute('placeholder') || '') || /pesquisar|search/i.test(x.getAttribute('aria-label') || '')));
  if (!input) return null;
  input.focus();
  input.value = 'Chris Frantz Loops';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
});
console.log('typed:', typed);
await page.waitForTimeout(1500);
await page.keyboard.press('Enter');
await page.waitForTimeout(5000);
console.log('url:', page.url());

const links = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/in/"]'))
    .map(l => l.getAttribute('href'))
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .slice(0, 8);
  return links;
});
console.log('in/ links:', JSON.stringify(links));
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400));
console.log('body:', JSON.stringify(bodyText.slice(0, 300)));

await browser.close();
