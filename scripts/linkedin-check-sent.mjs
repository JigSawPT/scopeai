import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});
await sleep(2000);

// Extract conversation list items
const convos = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const items = Array.from(document.querySelectorAll('.msg-conversation-listitem__link, .msg-conversation-listitem, a[href*="/messaging/thread/"]')).filter(vis);
  return items.map(i => (i.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90)).filter(t => t.length > 3).slice(0, 40);
});
console.log('conversations:', JSON.stringify(convos, null, 1));

// Also check the "sent" tab if available
const tabs = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  return Array.from(document.querySelectorAll('button')).filter(vis)
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 30)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 20);
});
console.log('tabs:', JSON.stringify(tabs));

await browser.close();
