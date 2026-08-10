import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { name: 'Socialinsider', search: 'Socialinsider', ctx: 'social media analytics vs Sprout/Hootsuite' },
  { name: 'KyLeads', search: 'KyLeads', ctx: 'lead generation vs OptinMonster' },
  { name: 'WooRank', search: 'WooRank', ctx: 'SEO audit vs SEMrush/Screaming Frog' },
  { name: 'Linear', search: 'Linear app', ctx: 'project management vs Asana/Monday' },
];

function shortNote(firstName, ctx) {
  const note = `Hi ${firstName} — I built ScopeAI: AI agents that produce competitive intelligence reports in ~3 minutes with live web citations. Thought it could help with ${ctx}. Demo: https://scopeai-746706977308.us-central1.run.app/demo`;
  return note.length > 290 ? note.slice(0, 287) + '...' : note;
}

async function removeOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
  });
}

async function typeText(page, text) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
  }
}

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
if (page.url().includes('/login')) throw new Error('Login necessario');

let sent = 0, failed = 0;
for (const t of TARGETS) {
  console.log(`\n[retry] ${t.name}`);
  try {
    await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(t.search), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4500);
    await removeOverlays(page);
    const href = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
      for (const l of links) { const h = l.getAttribute('href'); if (h && h.includes('/in/')) return h; }
      return null;
    });
    if (!href) throw new Error('Sem resultados');
    const profileUrl = (href.startsWith('http') ? href : 'https://www.linkedin.com' + href).replace(/\?trk=.*$/, '');

    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
    await removeOverlays(page);
    await sleep(1000);

    const firstName = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? (h1.textContent || '').trim().split(' ')[0] : 'there';
    });
    const note = shortNote(firstName, t.ctx);

    const composeHref = await page.evaluate(() => {
      const vis = el => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
      };
      const a = Array.from(document.querySelectorAll('a')).find(e => vis(e) && /message|mensagem/i.test((e.textContent || '').trim()) && (e.getAttribute('href') || '').includes('messaging/compose'));
      return a ? a.getAttribute('href') : null;
    });
    if (!composeHref) throw new Error('Sem compose link');

    // Try up to 2 times with reload
    let editor = null;
    for (let attempt = 1; attempt <= 2 && !editor; attempt++) {
      await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(9000);
      await removeOverlays(page);
      editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 12000 }).catch(() => null);
      if (!editor) console.log(`  attempt ${attempt}: editor nao renderizou, reload...`);
    }
    if (!editor) throw new Error('Editor nunca renderizou');

    await editor.click();
    await sleep(500);
    await typeText(page, note);
    await sleep(1000);

    const sendRect = await page.evaluate(() => {
      const vis = el => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
      };
      const btns = Array.from(document.querySelectorAll('button')).filter(vis);
      const b = btns.find(x => (x.className || '').includes('msg-form__send-btn'));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (!sendRect) throw new Error('Send btn nao encontrado');
    await page.mouse.click(sendRect.x, sendRect.y);
    await sleep(3000);

    const cleared = await page.evaluate(() => {
      const vis = el => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
      };
      const editor = Array.from(document.querySelectorAll('.msg-form__contenteditable')).find(vis);
      if (!editor) return 'compose-gone';
      return (editor.textContent || '').trim().length === 0 ? 'cleared' : 'has-text';
    });
    console.log(`  ✓ MENSAGEM enviada (${cleared}) para ${firstName}`);
    sent++;
    await sleep(10000);
  } catch (err) {
    console.log(`  ✗ FALHOU: ${err.message}`);
    failed++;
    await sleep(2000);
  }
}

console.log(`\n[retry] COMPLETO: ${sent} enviadas, ${failed} falhadas`);
await sleep(3000);
await browser.close();
