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

const composeHref = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const a = Array.from(document.querySelectorAll('a')).find(e => vis(e) && /message|mensagem/i.test((e.textContent || '').trim()) && (e.getAttribute('href') || '').includes('messaging/compose'));
  return a ? a.getAttribute('href') : null;
});
console.log('compose href found:', !!composeHref);

await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

// Wait for VISIBLE editor
const editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 15000 }).catch(() => null);
console.log('visible editor:', editor ? 'found' : 'NOT found');

if (editor) {
  await editor.click();
  await sleep(400);
  const msg = 'Test message from ScopeAI automation - please ignore.';
  for (const char of msg) await page.keyboard.type(char, { delay: 5 });
  await sleep(1000);

  // Dump all buttons in the compose area with text/aria/class
  const btns = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    return Array.from(document.querySelectorAll('.msg-form__actions button, .msg-overlay-conversation-bubble button, .msg-form button, [class*="msg-form"] button'))
      .filter(vis)
      .map(b => ({
        text: (b.textContent || '').trim().slice(0, 30),
        aria: b.getAttribute('aria-label'),
        cls: (b.className || '').slice(0, 60),
      }))
      .filter(b => b.text || b.aria);
  });
  console.log('compose buttons:', JSON.stringify(btns, null, 1));

  // Find send button by aria or class
  const sendInfo = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const btns = Array.from(document.querySelectorAll('button')).filter(vis);
    const b = btns.find(x => /enviar|send/i.test((x.getAttribute('aria-label') || ''))) 
           || btns.find(x => (x.className || '').includes('msg-form__send-button'));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, aria: b.getAttribute('aria-label'), cls: (b.className || '').slice(0, 60) };
  });
  console.log('send button info:', JSON.stringify(sendInfo));

  if (sendInfo) {
    await page.mouse.click(sendInfo.x, sendInfo.y);
    await sleep(3000);
    // Check if editor cleared (message sent)
    const editorText = await page.$eval('.msg-form__contenteditable', el => el.textContent).catch(() => 'n/a');
    console.log('editor after send:', JSON.stringify(editorText));
  }
}

await browser.close();
