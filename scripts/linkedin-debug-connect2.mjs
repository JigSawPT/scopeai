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

// Open More menu and click Conectar
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
  const more = btns.find(b => /^mais$|^more$/i.test((b.textContent || '').trim()));
  if (more) more.click();
});
await page.waitForTimeout(2000);

const connectClicked = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"], .artdeco-dropdown__item, [role="listbox"] [role="option"]'));
  const target = items.find(i => /conectar|connect/i.test((i.textContent || '').trim()));
  if (!target) return 'not found';
  target.click();
  return 'clicked';
});
console.log('connect item:', connectClicked);
await page.waitForTimeout(3000);

const dialog = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"], .artdeco-modal');
  return d ? d.innerText.slice(0, 600) : 'no dialog';
});
console.log('dialog text:', JSON.stringify(dialog.slice(0, 500)));

const dialogBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="dialog"] button'))
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50))
    .filter(t => t.length > 0)
);
console.log('dialog buttons:', JSON.stringify(dialogBtns));

const textareas = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="dialog"] textarea, [role="dialog"] [contenteditable="true"]'))
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 50))
);
console.log('dialog textareas:', JSON.stringify(textareas));

await browser.close();
