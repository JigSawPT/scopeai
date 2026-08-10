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

// Click the More ("Mais") button
const moreClicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
  const target = btns.find(b => /^mais$|^more$/i.test((b.textContent || '').trim()));
  if (!target) return 'not found';
  target.click();
  return 'clicked';
});
console.log('more click:', moreClicked);
await page.waitForTimeout(2500);

// Inspect the dropdown menu
const menuItems = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"], [data-test-id="profile-actions"] li, .artdeco-dropdown__item, [role="listbox"] [role="option"]'));
  return items.map(i => (i.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50)).filter(t => t.length > 0);
});
console.log('menu items:', JSON.stringify(menuItems, null, 1));

// Also grab any visible dropdown text
const allText = await page.evaluate(() => {
  const drop = document.querySelector('[role="menu"], .artdeco-dropdown__content, #artdeco-dropdown-1');
  return drop ? drop.innerText.slice(0, 500) : 'no dropdown container';
});
console.log('dropdown text:', JSON.stringify(allText.slice(0, 400)));

await browser.close();
