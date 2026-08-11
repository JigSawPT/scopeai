import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const DEMO_URL = 'https://scopeai-746706977308.us-central1.run.app/demo';

const TARGETS = [
  { name: 'Chris Walker', first: 'Chris', company: 'Refine', url: 'https://www.linkedin.com/in/chriswalkerca/', message: `Hi Chris - love Refine Labs' demand gen content. I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would it fit your GTM research workflow? Demo: ${DEMO_URL}` },
  { name: 'Mostafa ElBermawy', first: 'Mostafa', company: 'NoGood', url: 'https://www.linkedin.com/in/mostafaelbermawy/', message: `Hi Mostafa - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Could it speed up NoGood's growth research for clients? Demo: ${DEMO_URL}` },
  { name: 'Ashley Levesque', first: 'Ashley', company: 'Tuff', url: 'https://www.linkedin.com/in/ashleylevesque/', message: `Hi Ashley - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would it help Tuff's channel research for startup clients? Demo: ${DEMO_URL}` },
  { name: 'Theo Moulos', first: 'Theo', company: 'GrowthRocks', url: 'https://www.linkedin.com/in/theomoulos/', message: `Hi Theo - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Could it support GrowthRocks' experimentation work? Demo: ${DEMO_URL}` },
  { name: 'William Craig', first: 'William', company: 'WebFX', url: 'https://www.linkedin.com/in/williamcraig/', message: `Hi William - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Could it be an add-on service for WebFX clients? Demo: ${DEMO_URL}` },
  { name: 'Paul Copplestone', first: 'Paul', company: 'Supabase', url: 'https://www.linkedin.com/in/paulcopplestone/', message: `Hi Paul - love what Supabase is building. I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a brief on Firebase be useful? Demo: ${DEMO_URL}` },
  { name: 'Jack Ellis', first: 'Jack', company: 'Fathom', url: 'https://www.linkedin.com/in/jackellis/', message: `Hi Jack - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a brief on Plausible/GA4 positioning be useful to Fathom? Demo: ${DEMO_URL}` },
  { name: 'Patrick Woods', first: 'Patrick', company: 'Orbit', url: 'https://www.linkedin.com/in/patrickjwoods/', message: `Hi Patrick - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Useful for community/analytics positioning? Demo: ${DEMO_URL}` },
  { name: 'Vladimir Vukicevic', first: 'Vladimir', company: 'Tella', url: 'https://www.linkedin.com/in/vladimirvukicevic/', message: `Hi Vladimir - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a Loom brief help Tella's positioning? Demo: ${DEMO_URL}` },
  { name: 'Thomas Mann', first: 'Thomas', company: 'Raycast', url: 'https://www.linkedin.com/in/thomasmann-raycast/', message: `Hi Thomas - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would an Alfred/Spotlight brief be useful to Raycast? Demo: ${DEMO_URL}` },
  { name: 'Hahnbee Lee', first: 'Hahnbee', company: 'Mintlify', url: 'https://www.linkedin.com/in/hahnbeelee/', message: `Hi Hahnbee - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a ReadMe/GitBook brief help Mintlify? Demo: ${DEMO_URL}` },
  { name: 'Nikita Shamgunov', first: 'Nikita', company: 'Neon', url: 'https://www.linkedin.com/in/nikita-shamgunov/', message: `Hi Nikita - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a Supabase/PlanetScale brief be useful to Neon? Demo: ${DEMO_URL}` },
];

const browser = await chromium.launchPersistentContext(SESSION, { headless: false, viewport: { width: 1280, height: 850 } });
const page = browser.pages()[0] || await browser.newPage();
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

      const profile = await page.evaluate(() => {
        const h2s = Array.from(document.querySelectorAll('h2')).map(h => (h.textContent || '').trim());
        const name = h2s.find(t => t.length > 1 && t.length < 60 && !/^\d/.test(t)) || '';
        const body = document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 900);
        const composeLinks = Array.from(document.querySelectorAll('a[href*="messaging/compose"]'))
          .map(a => a.getAttribute('href'))
          .filter(h => h && h.includes('recipient='));
        return { name, body, composeLinks };
      });

      if (!profile.name.toLowerCase().includes(target.first.toLowerCase())) {
        results.push({ target: target.name, status: 'skipped', reason: `name mismatch (found "${profile.name.slice(0, 40)}")` });
        continue;
      }
      if (!profile.body.toLowerCase().includes(target.company.toLowerCase())) {
        results.push({ target: target.name, status: 'skipped', reason: `company "${target.company}" not in profile` });
        continue;
      }
      if (!profile.body.includes('Enviar mensagem') && !profile.body.includes('Message')) {
        results.push({ target: target.name, status: 'skipped', reason: 'connect-only profile (no direct messaging)' });
        continue;
      }
      const composeHref = profile.composeLinks[0];
      if (!composeHref) {
        results.push({ target: target.name, status: 'skipped', reason: 'no compose link available' });
        continue;
      }

      await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(6_000);
      await page.evaluate(() => {
        document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el.remove());
      });
      const editor = await page.locator('.msg-form__contenteditable:visible').waitFor({ state: 'visible', timeout: 12_000 }).then(() => page.locator('.msg-form__contenteditable:visible').first()).catch(() => null);
      if (!editor) {
        results.push({ target: target.name, status: 'skipped', reason: 'compose editor did not render' });
        continue;
      }

      await editor.click();
      await page.keyboard.type(target.message, { delay: 8 });
      await sleep(1_000);
      const typed = (await editor.textContent() || '').replace(/\s+/g, ' ').trim();
      if (typed.length < target.message.replace(/\s+/g, ' ').trim().length - 10) {
        results.push({ target: target.name, status: 'failed', reason: 'text did not enter editor' });
        continue;
      }

      const sendBtn = page.locator('button.msg-form__send-btn:visible');
      if (await sendBtn.count() !== 1) throw new Error('send button not found');
      await sendBtn.click();
      await sleep(3_000);
      const cleared = await page.evaluate(() => {
        const vis = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        const ed = Array.from(document.querySelectorAll('.msg-form__contenteditable')).find(vis);
        return ed ? (ed.textContent || '').trim().length === 0 : 'compose-gone';
      });
      results.push({ target: target.name, status: cleared === true || cleared === 'compose-gone' ? 'sent' : 'sent-unverified' });
      await sleep(7_000);
    } catch (error) {
      results.push({ target: target.name, status: 'failed', reason: error instanceof Error ? error.message : String(error) });
    }
  }
} finally {
  await browser.close();
  fs.writeFileSync('outreach_batch3_results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
