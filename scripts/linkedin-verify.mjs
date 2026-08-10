import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const results = JSON.parse(fs.readFileSync('./outreach_results.json', 'utf8'));

async function getProfileState(page) {
  return page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const texts = Array.from(document.querySelectorAll('button')).filter(vis).map(b => (b.textContent || '').trim()).filter(t => t.length > 0 && t.length < 30);
    const unique = texts.filter((v, i, a) => a.indexOf(v) === i);
    if (unique.some(t => /^pendente$/i.test(t))) return 'PENDING';
    if (unique.some(t => /^mensagem$/i.test(t))) return 'MESSAGE';
    if (unique.some(t => /^(conectar|connect|ligar)$/i.test(t))) return 'CONNECT';
    if (unique.some(t => /^seguir$/i.test(t))) return 'FOLLOW';
    return 'UNKNOWN';
  });
}

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

const final = [];
for (const r of results) {
  if (!r.profile) { final.push({ target: r.target, state: 'no-profile' }); continue; }
  const url = r.profile.replace('?trk=universal-search-cluster', '').replace('?trk=people-search-result', '');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(7000);
  let state = await getProfileState(page);
  if (state === 'UNKNOWN') {
    await page.waitForTimeout(4000);
    state = await getProfileState(page);
  }
  console.log(`${r.target}: ${state}`);
  final.push({ target: r.target, url, state, prevAction: r.action });
  await sleep(2000);
}

fs.writeFileSync('./outreach_final_status.json', JSON.stringify(final, null, 2));
console.log('\nSaved to outreach_final_status.json');

// Summary
const counts = {};
for (const f of final) counts[f.state] = (counts[f.state] || 0) + 1;
console.log('SUMMARY:', JSON.stringify(counts));

await browser.close();
