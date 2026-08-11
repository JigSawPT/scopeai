import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const DEMO_URL = 'https://scopeai-746706977308.us-central1.run.app/demo';

const TARGETS = [
  { name: 'Steven Tey', first: 'Steven', company: 'Dub', url: 'https://www.linkedin.com/in/steventey/', message: `Hi Steven - love what you've built at Dub. I'm testing ScopeAI: it turns public competitor pricing, positioning, and review evidence into a cited competitive brief in minutes. Would you try it on Bitly/Short.io and tell me if it's useful? Demo: ${DEMO_URL}` },
  { name: 'Jen Spencer', first: 'Jen', company: 'Booth', url: 'https://www.linkedin.com/in/jenspencer/', message: `Hi Jen - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Your work scaling B2B teams makes me think you'd give sharp feedback. Would you try it? Demo: ${DEMO_URL}` },
  { name: 'Garrett Mehrguth', first: 'Garrett', company: 'Directive', url: 'https://www.linkedin.com/in/garrettmehrguth/', message: `Hi Garrett - Directive does competitive positioning work for B2B clients constantly. I'm testing ScopeAI: a cited competitive brief in minutes. Could it help on a client engagement? I'd set up a $49 pilot for direct feedback. Demo: ${DEMO_URL}` },
  { name: 'Sujan Patel', first: 'Sujan', company: 'Mailshake', url: 'https://www.linkedin.com/in/sujanpatel/', message: `Hi Sujan - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would it help with Mailshake's positioning against competitors? Demo: ${DEMO_URL}` },
  { name: 'Nick Franklin', first: 'Nick', company: 'ChartMogul', url: 'https://www.linkedin.com/in/nickfranklin/', message: `Hi Nick - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a brief on Baremetrics/ProfitWell be useful to ChartMogul? Demo: ${DEMO_URL}` },
  { name: 'Josh Pigford', first: 'Josh', company: 'Baremetrics', url: 'https://www.linkedin.com/in/joshpigford/', message: `Hi Josh - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would a brief on ChartMogul/ProfitWell be useful? Demo: ${DEMO_URL}` },
  { name: 'Patrick Campbell', first: 'Patrick', company: 'ProfitWell', url: 'https://www.linkedin.com/in/patrickcampbell/', message: `Hi Patrick - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Could it be useful in your pricing and GTM advisory work? Demo: ${DEMO_URL}` },
  { name: 'Guillaume Odier', first: 'Guillaume', company: 'PhantomBuster', url: 'https://www.linkedin.com/in/guillaumeodier/', message: `Hi Guillaume - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. PhantomBuster competes in a crowded space - useful? Demo: ${DEMO_URL}` },
];

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
});
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

      const connectOnly = !profile.body.includes('Enviar mensagem') && !profile.body.includes('Message');
      if (connectOnly) {
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
      const expected = target.message.replace(/\s+/g, ' ').trim();
      if (typed.length < expected.length - 10) {
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
        const editor = Array.from(document.querySelectorAll('.msg-form__contenteditable')).find(vis);
        return editor ? (editor.textContent || '').trim().length === 0 : 'compose-gone';
      });

      results.push({ target: target.name, status: cleared === true || cleared === 'compose-gone' ? 'sent' : `sent-unverified (${cleared})` });
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
