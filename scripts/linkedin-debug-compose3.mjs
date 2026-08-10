import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/messaging/compose/?recipient=183080829', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
console.log('url:', page.url());

const state = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const editors = Array.from(document.querySelectorAll('textarea, div[contenteditable="true"], [data-lexical-editor], .msg-form__contenteditable')).filter(vis)
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 50));
  const senders = Array.from(document.querySelectorAll('button')).filter(vis)
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 30 && /enviar|send/i.test(t));
  const bodyText = document.body.innerText.slice(0, 400);
  return { editors, senders, bodyText };
});
console.log('visible editors:', JSON.stringify(state.editors));
console.log('send buttons:', JSON.stringify(state.senders));
console.log('body:', JSON.stringify(state.bodyText.slice(0, 250)));

await browser.close();
