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

const info = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const allEditable = Array.from(document.querySelectorAll('[contenteditable], textarea, [role="textbox"], .msg-form__contenteditable, [data-lexical-editor]'))
    .map(e => ({
      tag: e.tagName,
      vis: vis(e),
      cls: (e.className || '').slice(0, 60),
      placeholder: e.getAttribute('data-placeholder') || e.getAttribute('placeholder') || '',
      role: e.getAttribute('role') || '',
    }));
  const bodyText = document.body.innerText;
  const composeIdx = bodyText.search(/mensagem|message/i);
  return {
    editableCount: allEditable.length,
    editable: allEditable,
    composeSnippet: composeIdx !== -1 ? bodyText.slice(Math.max(0, composeIdx - 100), composeIdx + 300) : 'not found',
  };
});
console.log('editable elements:', JSON.stringify(info.editable, null, 1).slice(0, 2000));
console.log('compose snippet:', JSON.stringify(info.composeSnippet));

await browser.close();
