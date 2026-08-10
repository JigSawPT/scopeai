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

// Get memberId from profile
await page.goto('https://www.linkedin.com/in/ctfrantz', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);
const memberId = await page.evaluate(() => {
  const meta = document.querySelector('meta[id="config"]');
  return meta ? meta.getAttribute('data-member-id') : null;
});
console.log('memberId:', memberId);

// Try mwlite compose URL
await page.goto(`https://www.linkedin.com/mwlite/messaging/compose?recipient=${memberId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
console.log('url:', page.url());

const info = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const editors = Array.from(document.querySelectorAll('[contenteditable], textarea, [role="textbox"]')).filter(vis)
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 50));
  const senders = Array.from(document.querySelectorAll('button')).filter(vis)
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 30 && /enviar|send/i.test(t));
  const bodyText = document.body.innerText;
  return { editors, senders, bodyHead: bodyText.slice(0, 400) };
});
console.log('editors:', JSON.stringify(info.editors));
console.log('send:', JSON.stringify(info.senders));
console.log('body:', JSON.stringify(info.bodyHead.slice(0, 300)));

await browser.close();
