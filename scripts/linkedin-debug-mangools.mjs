import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function cleanPage(page) {
  await page.evaluate(() => {
    const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /^aceitar$/i.test((x.textContent || '').trim()));
    if (b) b.click();
  });
  await sleep(800);
  await page.evaluate(() => {
    document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
  });
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(500); }
  await sleep(500);
}

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent('Mangools SEO'), { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4500);
await cleanPage(page);
const href = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
  for (const l of links) { const h = l.getAttribute('href'); if (h && h.includes('/in/')) return h; }
  return null;
});
const profileUrl = (href.startsWith('http') ? href : 'https://www.linkedin.com' + href).replace(/\?trk=.*$/, '');
await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
await cleanPage(page);

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
await cleanPage(page);

const editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 12000 }).catch(() => null);
console.log('editor:', editor ? 'found' : 'not found');
if (editor) {
  await editor.click();
  await sleep(400);
  const msg = 'Hi Alejandro — test message, please ignore.';
  for (const char of msg) await page.keyboard.type(char, { delay: 5 });
  await sleep(1500);

  const btns = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    return Array.from(document.querySelectorAll('button')).filter(vis)
      .map(b => ({
        text: (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        aria: b.getAttribute('aria-label'),
        cls: (b.className || '').slice(0, 70),
      }))
      .filter(b => b.text || b.aria)
      .slice(0, 25);
  });
  console.log('visible buttons after typing:');
  btns.forEach(b => console.log(' -', JSON.stringify(b)));
}

await browser.close();
