import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent('Kalungi agency'), {
  waitUntil: 'domcontentloaded', timeout: 30000
});
await page.waitForTimeout(4000);

const href = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
  for (const l of links) {
    const h = l.getAttribute('href');
    if (h && h.includes('/in/')) return h;
  }
  return null;
});
console.log('profile href:', href);

await page.goto(href.startsWith('http') ? href : 'https://www.linkedin.com' + href, {
  waitUntil: 'domcontentloaded', timeout: 30000
});
await page.waitForTimeout(4000);
console.log('profile url:', page.url());

const btns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('button'))
    .map(b => ({ t: (b.textContent || '').trim().slice(0, 30), a: b.getAttribute('aria-label') }))
    .filter(x => /message|mensagem/i.test((x.t || '') + ' ' + (x.a || '')))
    .slice(0, 5)
);
console.log('msg buttons:', JSON.stringify(btns));

const clicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const target = btns.find(b => /message|mensagem/i.test((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '')));
  if (!target) return false;
  target.click();
  return true;
});
console.log('clicked message:', clicked);
await page.waitForTimeout(5000);

console.log('url after click:', page.url());
const editors = await page.evaluate(() =>
  Array.from(document.querySelectorAll('div[contenteditable="true"], textarea, [data-lexical-editor], div[role="textbox"]'))
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 60))
);
console.log('editors found:', JSON.stringify(editors));

const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 500) : 'no body');
console.log('body text:', JSON.stringify(bodyText.slice(0, 400)));

await browser.close();
