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

// Click "Enviar perfil em uma mensagem"
const clicked = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"], .artdeco-dropdown__item, [role="listbox"] [role="option"]'));
  const target = items.find(i => /enviar perfil em uma mensagem|send profile in a message/i.test((i.textContent || '').trim()));
  if (!target) return 'not found';
  target.click();
  return 'clicked';
});
console.log('send-profile-in-message:', clicked);
await page.waitForTimeout(5000);

console.log('url:', page.url());

const editors = await page.evaluate(() =>
  Array.from(document.querySelectorAll('div[contenteditable="true"], textarea, [data-lexical-editor], div[role="textbox"]'))
    .map(e => e.tagName + '.' + (e.className || '').slice(0, 60))
);
console.log('editors:', JSON.stringify(editors));

const panelText = await page.evaluate(() => {
  const panel = document.querySelector('[role="dialog"], .msg-overlay-conversation-bubble, [id*="msg-overlay"], .msg-overlay-list-bubble-header');
  return panel ? panel.innerText.slice(0, 300) : 'no panel';
});
console.log('panel:', JSON.stringify(panelText.slice(0, 250)));

const sendBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('button'))
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
    .filter(t => /enviar|send/i.test(t))
);
console.log('send buttons:', JSON.stringify(sendBtns));

await browser.close();
