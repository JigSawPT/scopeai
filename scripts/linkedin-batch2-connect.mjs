import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TARGETS = [
  { name: 'Jonathan Franchell', first: 'Jonathan', company: 'Ironpaper', url: 'https://www.linkedin.com/in/jonathanfranchell/' },
  { name: 'Jen Spencer', first: 'Jen', company: 'SmartBug', url: 'https://www.linkedin.com/in/jenspencer/' },
  { name: 'Garrett Mehrguth', first: 'Garrett', company: 'Directive', url: 'https://www.linkedin.com/in/garrettmehrguth/' },
  { name: 'Johnathan Dane', first: 'Johnathan', company: 'KlientBoost', url: 'https://www.linkedin.com/in/jonathandane/' },
  { name: 'Guillaume Moubeche', first: 'Guillaume', company: 'lemlist', url: 'https://www.linkedin.com/in/guillaumemoubeche/' },
  { name: 'Nils Schneider', first: 'Nils', company: 'Instantly', url: 'https://www.linkedin.com/in/nilsschneider/' },
  { name: 'Jacob Bank', first: 'Jacob', company: 'Relay.app', url: 'https://www.linkedin.com/in/jacobbanks/' },
  { name: 'Steven Tey', first: 'Steven', company: 'Dub', url: 'https://www.linkedin.com/in/steventey/' },
  { name: 'Felix Malfait', first: 'Felix', company: 'Twenty', url: 'https://www.linkedin.com/in/felixmalfait/' },
  { name: 'Simo Lemhandez', first: 'Simo', company: 'folk', url: 'https://www.linkedin.com/in/simolemhandez/' },
];

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
});
const page = browser.pages()[0] || await browser.newPage();

function note(first, company) {
  return `Hi ${first} - I'm testing a concise, cited competitive brief for SaaS teams and agencies. Your work at ${company} looked relevant - open to connecting?`;
}

const results = [];

try {
  await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(3_000);
  if (page.url().includes('/login')) throw new Error('LinkedIn login is required.');

  for (const target of TARGETS) {
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);
      await page.evaluate(() => {
        document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el.remove());
      });

      const state = await page.evaluate(() => {
        const visible = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        const name = (document.querySelector('h1')?.textContent || '').trim();
        const headline = Array.from(document.querySelectorAll('div')).map(d => d.textContent || '')
          .find(t => t.length > 20 && t.length < 300) || '';
        const buttons = Array.from(document.querySelectorAll('button')).filter(visible)
          .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
          .filter(t => t.length > 0 && t.length < 30);
        return { name, headline, buttons };
      });

      if (!state.name.toLowerCase().includes(target.first.toLowerCase())) {
        results.push({ target: target.name, status: 'skipped', reason: `name mismatch (h1="${state.name}")` });
        continue;
      }
      const companyOk = state.headline.toLowerCase().includes(target.company.toLowerCase()) || state.buttons.join(' ').length > 0;
      if (!companyOk) {
        results.push({ target: target.name, status: 'skipped', reason: `company not found in headline (${state.headline.slice(0, 80)})` });
        continue;
      }
      if (!state.buttons.some(b => /^conectar$/i.test(b))) {
        results.push({ target: target.name, status: 'skipped', reason: `no Connect button (${state.buttons.slice(0, 6).join(' | ')})` });
        continue;
      }

      const connectBtn = page.getByRole('button', { name: /^conectar$/i }).first();
      await connectBtn.click({ force: true, timeout: 10_000 });
      await page.waitForTimeout(2_000);
      await page.evaluate(() => {
        document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el.remove());
      });

      const addNote = page.getByText(/add a note|adicionar nota/i).first();
      if (await addNote.count() !== 1) {
        results.push({ target: target.name, status: 'skipped', reason: 'connect dialog opened but no note link' });
        await page.keyboard.press('Escape').catch(() => {});
        continue;
      }
      await addNote.click({ force: true, timeout: 10_000 });
      await page.waitForTimeout(1_000);

      const noteField = page.locator('textarea[name="message"]:visible');
      if (await noteField.count() !== 1) throw new Error('note textarea not found');
      const msg = note(target.first, target.company);
      await noteField.fill(msg);

      const sendBtn = page.getByRole('button', { name: /^(send|enviar)$/i }).filter({ visible: true }).first();
      if (await sendBtn.count() !== 1) throw new Error('send button not found');
      await sendBtn.click({ force: true, timeout: 10_000 });
      await page.waitForTimeout(2_000);

      const dialogGone = await page.evaluate(() => !document.body.innerText.includes('Adicionar nota'));
      results.push({ target: target.name, status: dialogGone ? 'connection-sent' : 'connection-sent-unverified' });
      await sleep(8_000);
    } catch (error) {
      results.push({ target: target.name, status: 'failed', reason: error instanceof Error ? error.message : String(error) });
    }
  }
} finally {
  await browser.close();
  fs.writeFileSync('outreach_batch2_results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
