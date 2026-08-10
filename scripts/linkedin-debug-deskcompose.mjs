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
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

// Extract the compose link
const composeHref = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const a = Array.from(document.querySelectorAll('a')).find(e => vis(e) && /message|mensagem/i.test((e.textContent || '').trim()) && (e.getAttribute('href') || '').includes('messaging/compose'));
  return a ? a.getAttribute('href') : null;
});
console.log('compose href:', composeHref);

if (composeHref) {
  await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
  });
  await sleep(1000);

  const state = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const editors = Array.from(document.querySelectorAll('[contenteditable], textarea, [role="textbox"], .msg-form__contenteditable, [data-lexical-editor]')).filter(vis)
      .map(e => e.tagName + '.' + (e.className || '').slice(0, 50) + '|ph:' + (e.getAttribute('data-placeholder') || '').slice(0, 30));
    const senders = Array.from(document.querySelectorAll('button')).filter(vis)
      .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(t => t.length > 0 && t.length < 30 && /enviar|send/i.test(t));
    return { editors, senders };
  });
  console.log('editors:', JSON.stringify(state.editors));
  console.log('send:', JSON.stringify(state.senders));

  // If editor found, type a test and check send works
  if (state.editors.length > 0) {
    const editor = await page.$('[contenteditable], textarea, [role="textbox"], .msg-form__contenteditable, [data-lexical-editor]');
    if (editor) {
      await editor.click();
      await sleep(400);
      const testText = 'Test message from ScopeAI automation - please ignore.';
      for (const char of testText) {
        await page.keyboard.type(char, { delay: 5 });
      }
      await sleep(500);
      console.log('typed OK — editor works!');
    }
  }
}

await browser.close();
