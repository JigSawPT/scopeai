import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const DEMO_URL = 'https://scopeai-746706977308.us-central1.run.app/demo';

const RETRY = [
  { name: 'Garrett Mehrguth', first: 'Garrett', company: 'Directive', url: 'https://www.linkedin.com/in/garrettmehrguth/', message: `Hi Garrett - Directive does competitive positioning work for B2B clients constantly. I'm testing ScopeAI: a cited competitive brief in minutes. Could it help on a client engagement? I'd set up a $49 pilot for direct feedback. Demo: ${DEMO_URL}` },
  { name: 'Sujan Patel', first: 'Sujan', company: 'Mailshake', url: 'https://www.linkedin.com/in/sujanpatel/', message: `Hi Sujan - I'm testing ScopeAI: a cited competitive brief built from public pricing, positioning, and review evidence in minutes. Would it help with Mailshake's positioning against competitors? Demo: ${DEMO_URL}` },
];

const INSPECT = [
  ['Josh Pigford', 'https://www.linkedin.com/in/joshpigford/'],
  ['Patrick Campbell', 'https://www.linkedin.com/in/patrickcampbell/'],
  ['Guillaume Odier', 'https://www.linkedin.com/in/guillaumeodier/'],
];

const browser = await chromium.launchPersistentContext(SESSION, { headless: false, viewport: { width: 1280, height: 850 } });
const page = browser.pages()[0] || await browser.newPage();
const results = [];

try {
  await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(3_000);
  if (page.url().includes('/login')) throw new Error('Login required');

  await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(6_000);
  await page.evaluate(() => {
    document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el.remove());
  });
  const convos = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    return Array.from(document.querySelectorAll('.msg-conversation-listitem__link, a[href*="/messaging/thread/"]')).filter(vis)
      .map(i => (i.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80))
      .filter(t => t.length > 3);
  });
  results.push({ check: 'inbox', convos: convos.filter(c => /steven|jen/i.test(c)) });

  for (const target of RETRY) {
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);
      await page.evaluate(() => {
        document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el.remove());
      });
      const composeHref = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="messaging/compose"]')).map(a => a.getAttribute('href'));
        return links.find(h => h && h.includes('recipient=')) || null;
      });
      if (!composeHref) {
        results.push({ target: target.name, status: 'skipped', reason: 'no compose link' });
        continue;
      }

      let editor = null;
      for (let attempt = 1; attempt <= 2 && !editor; attempt++) {
        await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(9_000);
        await page.evaluate(() => {
          document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el.remove());
        });
        editor = await page.locator('.msg-form__contenteditable:visible').waitFor({ state: 'visible', timeout: 8_000 }).then(() => page.locator('.msg-form__contenteditable:visible').first()).catch(() => null);
        if (!editor) await sleep(3_000);
      }
      if (!editor) {
        results.push({ target: target.name, status: 'skipped', reason: 'compose editor never rendered (2 attempts)' });
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
      results.push({ target: target.name, status: cleared === true || cleared === 'compose-gone' ? 'sent' : `sent-unverified` });
      await sleep(6_000);
    } catch (error) {
      results.push({ target: target.name, status: 'failed', reason: error instanceof Error ? error.message : String(error) });
    }
  }

  for (const [name, url] of INSPECT) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);
    const role = await page.evaluate(() => {
      const body = document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 300);
      return body.replace(/^.*?(?:Sobre|About)/, '').slice(0, 220);
    });
    results.push({ target: name, inspect: role });
  }
} finally {
  await browser.close();
  fs.writeFileSync('outreach_batch2_retry.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
