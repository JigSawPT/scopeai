import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/wasambashir/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

// Click Mais (in main)
const maisClicked = await page.evaluate(() => {
  const main = document.querySelector('main');
  const btns = Array.from(main.querySelectorAll('button'));
  const b = btns.find(x => (x.textContent || '').trim() === 'Mais');
  if (!b) return false;
  b.click();
  return true;
});
console.log('mais clicked:', maisClicked);
await page.waitForTimeout(2000);

// Click Conectar menu item with Playwright real click
const item = await page.evaluateHandle(() => {
  const menu = document.querySelector('[role="menu"]');
  if (!menu) return null;
  return Array.from(menu.querySelectorAll('[role="menuitem"]')).find(i => /conectar|connect/i.test(i.textContent || ''));
});
if (item) {
  await item.asElement().click();
  console.log('conectar clicked (real)');
} else {
  console.log('conectar item NOT found');
}
await page.waitForTimeout(4000);

// Dump everything modal-like + body text
const info = await page.evaluate(() => {
  const modalish = Array.from(document.querySelectorAll('[role="dialog"], [class*="modal"], [data-test-modal], [aria-modal="true"]')).map(e => ({
    tag: e.tagName,
    id: e.id,
    cls: (e.className || '').slice(0, 60),
    text: (e.textContent || '').slice(0, 150),
  }));
  const bodyText = document.body.innerText;
  return { modalish, bodyTail: bodyText.slice(-1200) };
});
console.log('modal-ish elements:', JSON.stringify(info.modalish, null, 1).slice(0, 1500));
console.log('body tail:', JSON.stringify(info.bodyTail.slice(0, 800)));

await browser.close();
