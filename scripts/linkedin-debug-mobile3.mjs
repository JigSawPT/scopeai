import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/zehfernandes/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const buttons = Array.from(document.querySelectorAll('button')).filter(vis)
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 40)
    .filter((v, i, a) => a.indexOf(v) === i);
  const textareas = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'))
    .map(t => ({ vis: vis(t), cls: (t.className || '').slice(0, 50) }));
  const bodyText = document.body.innerText;
  return {
    buttons: buttons.slice(0, 25),
    textareas,
    pending: /pendente|pending|aguardando/i.test(bodyText),
    convite: /convite|invitation/i.test(bodyText),
    bodyHead: bodyText.slice(0, 500),
  };
});
console.log('visible buttons:', JSON.stringify(info.buttons));
console.log('textareas:', JSON.stringify(info.textareas));
console.log('pending text:', info.pending, '| invitation text:', info.convite);
console.log('body head:', JSON.stringify(info.bodyHead.slice(0, 400)));

await browser.close();
