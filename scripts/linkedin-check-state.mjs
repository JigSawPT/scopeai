import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});
await sleep(2000);

const convos = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const items = Array.from(document.querySelectorAll('.msg-conversation-listitem__link, a[href*="/messaging/thread/"]')).filter(vis);
  return items.map(i => (i.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100)).filter(t => t.length > 3).slice(0, 30);
});
console.log('CONVERSAS ATUAIS:');
convos.forEach(c => console.log(' -', c));

// Check Mangools compose state
console.log('\n--- Mangools compose check ---');
await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent('Mangools SEO'), { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4500);
const href = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
  for (const l of links) { const h = l.getAttribute('href'); if (h && h.includes('/in/')) return h; }
  return null;
});
const profileUrl = (href.startsWith('http') ? href : 'https://www.linkedin.com' + href).replace(/\?trk=.*$/, '');
await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
const composeHref = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const a = Array.from(document.querySelectorAll('a')).find(e => vis(e) && /message|mensagem/i.test((e.textContent || '').trim()) && (e.getAttribute('href') || '').includes('messaging/compose'));
  return a ? a.getAttribute('href') : null;
});
console.log('mangools profile:', profileUrl);
console.log('mangools compose link:', !!composeHref);

if (composeHref) {
  await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(9000);
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  console.log('compose body:', JSON.stringify(bodyText.slice(0, 800)));
}

await browser.close();
