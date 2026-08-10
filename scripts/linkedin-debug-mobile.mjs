import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 390, height: 844 },  // iPhone-ish
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

// Try the mobile site on the profile
await page.goto('https://www.linkedin.com/in/zehfernandes/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);
console.log('url:', page.url());
console.log('is mobile:', /m\.linkedin|Mobile/i.test(page.url() + ' ' + await page.evaluate(() => navigator.userAgent)));

// Dump buttons visible on the profile
const btns = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
  };
  return Array.from(document.querySelectorAll('button'))
    .filter(vis)
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 30)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 15);
});
console.log('visible buttons:', JSON.stringify(btns));

// Click visible Conectar/Ligar/Connect
const clicked = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
  };
  const btns = Array.from(document.querySelectorAll('button')).filter(vis);
  const b = btns.find(x => /^(ligar|conectar|connect|seguir)$/i.test((x.textContent || '').trim()));
  if (!b) return null;
  b.click();
  return (b.textContent || '').trim();
});
console.log('clicked:', clicked);
await page.waitForTimeout(3500);

// Inspect
const info = await page.evaluate(() => {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'))
    .filter(d => getComputedStyle(d).display !== 'none' && d.getBoundingClientRect().height > 0);
  const bodyText = document.body.innerText;
  return {
    dialogCount: dialogs.length,
    dialogTexts: dialogs.map(d => (d.innerText || '').slice(0, 300)),
    bodyHead: bodyText.slice(0, 600),
  };
});
console.log('visible dialogs:', info.dialogCount, JSON.stringify(info.dialogTexts));
console.log('body head:', JSON.stringify(info.bodyHead.slice(0, 400)));

// Look for note textarea
const ta = await page.$('[role="dialog"] textarea, [role="dialog"] [contenteditable="true"], textarea');
console.log('textarea:', ta ? 'found' : 'not found');

await browser.close();
