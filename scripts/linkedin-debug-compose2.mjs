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

await page.goto('https://www.linkedin.com/in/ctfrantz', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);

const memberId = await page.evaluate(() => {
  const meta = document.querySelector('meta[id="config"]');
  return meta ? meta.getAttribute('data-member-id') : null;
});
console.log('memberId:', memberId);

if (memberId) {
  await page.goto(`https://www.linkedin.com/messaging/compose/?recipient=${memberId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  console.log('compose url:', page.url());

  const state = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const editors = Array.from(document.querySelectorAll('textarea, div[contenteditable="true"], [data-lexical-editor]')).filter(vis)
      .map(e => e.tagName + '.' + (e.className || '').slice(0, 50));
    const senders = Array.from(document.querySelectorAll('button, [role="button"]')).filter(vis)
      .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(t => t.length > 0 && t.length < 30 && /enviar|send/i.test(t));
    return { editors, senders };
  });
  console.log('visible editors:', JSON.stringify(state.editors));
  console.log('send buttons:', JSON.stringify(state.senders));
}

await browser.close();
