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
await page.waitForTimeout(4000);

// Remove Premium banner overlay
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});
await page.waitForTimeout(8000);

const info = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const editors = Array.from(document.querySelectorAll('[contenteditable], textarea, [role="textbox"], .msg-form__contenteditable, [data-lexical-editor]'))
    .filter(vis).map(e => e.tagName + '.' + (e.className || '').slice(0, 50) + '|ph:' + (e.getAttribute('data-placeholder') || ''));
  const senders = Array.from(document.querySelectorAll('button')).filter(vis)
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 30 && /enviar|send/i.test(t));
  const bodyText = document.body.innerText;
  const recipientShown = /Chris|Loops/i.test(bodyText) ? 'yes' : 'no';
  return { editors, senders, recipientShown, bodyTail: bodyText.slice(0, 600) };
});
console.log('editors:', JSON.stringify(info.editors));
console.log('send:', JSON.stringify(info.senders));
console.log('recipient visible:', info.recipientShown);
console.log('body:', JSON.stringify(info.bodyTail.slice(0, 400)));

await browser.close();
