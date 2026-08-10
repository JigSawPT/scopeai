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

await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

const editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 15000 }).catch(() => null);
console.log('visible editor:', editor ? 'found' : 'NOT found');

if (editor) {
  await editor.click();
  await sleep(400);
  const msg = 'Test message from ScopeAI automation - please ignore.';
  for (const char of msg) await page.keyboard.type(char, { delay: 5 });
  await sleep(1200);

  const editorContent = await page.$eval('.msg-form__contenteditable', el => el.textContent).catch(() => 'n/a');
  console.log('editor content:', JSON.stringify(editorContent));

  // Dump ALL visible buttons with class containing 'msg' or send-like
  const all = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    return Array.from(document.querySelectorAll('button')).filter(vis)
      .map(b => ({ text: (b.textContent || '').trim().slice(0, 25), aria: b.getAttribute('aria-label'), cls: (b.className || '').slice(0, 70) }))
      .filter(b => (b.aria && /send|enviar/i.test(b.aria)) || /send/i.test(b.cls) || /msg-form/i.test(b.cls));
  });
  console.log('send-like buttons:', JSON.stringify(all, null, 1));
}

await browser.close();
