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

// List ALL buttons on the profile
const allBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('button'))
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
    .filter(t => t.length > 0)
    .slice(0, 20)
);
console.log('ALL buttons:', JSON.stringify(allBtns, null, 1));

// Try clicking Connect/Ligar
const clickedConnect = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const target = btns.find(b => /^(connect|ligar)$/i.test((b.textContent || '').trim()));
  if (!target) return 'not found';
  target.click();
  return 'clicked';
});
console.log('connect click:', clickedConnect);
await page.waitForTimeout(3000);

// Inspect dialog
const dialogText = await page.evaluate(() => {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .artdeco-modal, #artdeco-modal-1'));
  if (dialogs.length === 0) return 'no dialog found';
  return dialogs.map(d => (d.innerText || '').slice(0, 400)).join(' ||| ');
});
console.log('dialog:', JSON.stringify(dialogText.slice(0, 600)));

const dialogBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="dialog"] button, .artdeco-modal button'))
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
    .filter(t => t.length > 0)
);
console.log('dialog buttons:', JSON.stringify(dialogBtns));

const textareas = await page.evaluate(() =>
  Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'))
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 50))
);
console.log('textareas:', JSON.stringify(textareas));

// Try clicking "Add a note" toggle
const noteClicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('[role="dialog"] button, .artdeco-modal button, button'));
  const target = btns.find(b => /nota|note|personaliz/i.test((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '')));
  if (!target) return 'not found';
  target.click();
  return 'clicked: ' + ((target.textContent || '').trim().slice(0, 40));
});
console.log('note toggle:', noteClicked);
await page.waitForTimeout(2000);

const textareas2 = await page.evaluate(() =>
  Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'))
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 50))
);
console.log('textareas after note click:', JSON.stringify(textareas2));

const finalDialogBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="dialog"] button'))
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
    .filter(t => t.length > 0)
);
console.log('final dialog buttons:', JSON.stringify(finalDialogBtns));

await browser.close();
