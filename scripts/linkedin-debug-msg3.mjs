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

await page.goto('https://www.linkedin.com/in/ctfrantz', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);

const html = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const els = Array.from(document.querySelectorAll('div, a, button, span'));
  const m = els.find(e => vis(e) && (e.textContent || '').trim() === 'Mensagem' && e.children.length <= 1);
  if (!m) return 'not found';
  // climb to the action container
  let parent = m;
  for (let i = 0; i < 4 && parent.parentElement; i++) parent = parent.parentElement;
  return parent.outerHTML.slice(0, 2500);
});
console.log(html);

await browser.close();
