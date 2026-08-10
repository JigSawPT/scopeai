import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/ctfrantz', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);

// Remove overlay
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});
await sleep(1000);

// Find Message button — list candidate elements
const candidates = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  return Array.from(document.querySelectorAll('button, a, [role="button"], div, span'))
    .filter(e => vis(e) && /message|mensagem/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 30)
    .map(e => ({ tag: e.tagName, text: (e.textContent || '').trim(), cls: (e.className || '').slice(0, 50), href: e.getAttribute('href') }))
    .slice(0, 8);
});
console.log('message candidates:', JSON.stringify(candidates));

// Click the most specific one (button or a with exact text)
const clicked = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const els = Array.from(document.querySelectorAll('button, a'));
  const target = els.find(e => vis(e) && /^(message|mensagem)$/i.test((e.textContent || '').trim()));
  if (!target) return 'not found';
  const r = target.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log('target rect:', JSON.stringify(clicked));

if (clicked && clicked.x) {
  await page.mouse.click(clicked.x, clicked.y); // TRUSTED click
  await sleep(6000);
  console.log('url:', page.url());

  const state = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const editors = Array.from(document.querySelectorAll('[contenteditable], textarea, [role="textbox"], .msg-form__contenteditable, [data-lexical-editor]')).filter(vis)
      .map(e => e.tagName + '.' + (e.className || '').slice(0, 60) + '|ph:' + (e.getAttribute('data-placeholder') || '').slice(0, 30));
    const senders = Array.from(document.querySelectorAll('button')).filter(vis)
      .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(t => t.length > 0 && t.length < 30 && /enviar|send/i.test(t));
    return { editors, senders };
  });
  console.log('editors:', JSON.stringify(state.editors));
  console.log('send:', JSON.stringify(state.senders));
}

await browser.close();
