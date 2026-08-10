import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/wasambashir/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

// Open More menu
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
  const more = btns.find(b => /^mais$|^more$/i.test((b.textContent || '').trim()));
  if (more) more.click();
});
await page.waitForTimeout(2000);

// Click Conectar via JS on the menu item's clickable child
const clicked = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"], .artdeco-dropdown__item'));
  for (const it of items) {
    const t = (it.textContent || '').trim();
    if (/conectar|connect/i.test(t)) {
      const clickable = it.querySelector('span, a, button') || it;
      clickable.click();
      return 'clicked: ' + t.slice(0, 30);
    }
  }
  return 'not found';
});
console.log('connect:', clicked);
await page.waitForTimeout(5000);

// Broad search for dialog/textarea anywhere
const result = await page.evaluate(() => {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .artdeco-modal, [data-test-modal], .artdeco-modal-overlay'));
  const textareas = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
  const bodyText = document.body ? document.body.innerText : '';
  return {
    dialogCount: dialogs.length,
    dialogTexts: dialogs.map(d => (d.innerText || '').slice(0, 200)),
    textareaCount: textareas.length,
    textareaInfo: textareas.map(t => t.tagName + ':' + (t.className || '').slice(0, 40)),
    hasNotaText: /adicionar nota|add a note/i.test(bodyText),
    tail: bodyText.slice(-800),
  };
});
console.log('dialogs:', result.dialogCount, JSON.stringify(result.dialogTexts));
console.log('textareas:', result.textareaCount, JSON.stringify(result.textareaInfo));
console.log('hasNotaText:', result.hasNotaText);
console.log('body tail:', JSON.stringify(result.tail));

await browser.close();
