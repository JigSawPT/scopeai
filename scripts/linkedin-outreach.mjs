import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const TRACKER = './outreach_tracker.csv';
const RESULTS_FILE = './outreach_results.json';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { name: 'Kalungi', search: 'Kalungi marketing agency', ctx: 'B2B SaaS positioning and GTM work' },
  { name: 'Foundation Marketing', search: 'Foundation Marketing content', ctx: 'content strategy for tech companies' },
  { name: 'Single Grain', search: 'Single Grain digital marketing', ctx: 'SaaS marketing and competitive positioning' },
  { name: 'Bay Leaf Digital', search: 'Bay Leaf Digital', ctx: 'B2B SaaS marketing and competitive analysis' },
  { name: 'Hey Digital', search: 'Hey Digital SaaS growth', ctx: 'SaaS growth marketing' },
  { name: 'Mangools', search: 'Mangools SEO', ctx: 'SEO tools vs Ahrefs/SEMrush/Moz' },
  { name: 'Socialinsider', search: 'Socialinsider', ctx: 'social media analytics vs Sprout/Hootsuite' },
  { name: 'KyLeads', search: 'KyLeads', ctx: 'lead generation vs OptinMonster' },
  { name: 'Octoboard', search: 'Octoboard', ctx: 'business dashboards vs Databox/Geckoboard' },
  { name: 'WooRank', search: 'WooRank', ctx: 'SEO audit vs SEMrush/Screaming Frog' },
  { name: 'Chris Frantz', search: 'Chris Frantz Loops', ctx: 'email marketing vs Mailchimp/ConvertKit' },
  { name: 'Zeh Fernandes', search: 'Zeh Fernandes Resend', ctx: 'email infrastructure vs SendGrid/Postmark' },
  { name: 'Attio', search: 'Attio CRM', ctx: 'next-gen CRM vs HubSpot/Salesforce' },
  { name: 'Linear', search: 'Linear app', ctx: 'project management vs Asana/Monday' },
  { name: 'James Hawkins', search: 'James Hawkins PostHog', ctx: 'product analytics vs Mixpanel/Amplitude' },
  { name: 'Katelyn Bourgoin', search: 'Katelyn Bourgoin', ctx: 'buyer persona and market research' },
  { name: 'Andy Crestodina', search: 'Andy Crestodina', ctx: 'content marketing and competitive research' },
  { name: 'Peep Laja', search: 'Peep Laja', ctx: 'B2B messaging and positioning research' },
];

function shortNote(firstName, ctx) {
  const note = `Hi ${firstName} — I built ScopeAI: AI agents that produce competitive intelligence reports in ~3 minutes with live web citations. Thought it could help with ${ctx}. Demo: https://scopeai-746706977308.us-central1.run.app/demo`;
  return note.length > 290 ? note.slice(0, 287) + '...' : note;
}

function readDoneSet() {
  try {
    const csv = fs.readFileSync(TRACKER, 'utf8');
    const done = new Set();
    for (const line of csv.split('\n').slice(1)) {
      const parts = line.split(',');
      const name = parts[0].trim();
      const status = (parts[6] || '').trim();
      if (status.startsWith('Sent') || status.startsWith('Pending') || status.startsWith('Followed')) done.add(name);
    }
    return done;
  } catch { return new Set(); }
}

function updateTracker(name, status) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const csv = fs.readFileSync(TRACKER, 'utf8');
    const updated = csv.split('\n').map(line => {
      if (line.includes(name)) {
        const parts = line.split(',');
        if (parts.length >= 8) { parts[6] = status; parts[7] = today; }
        return parts.join(',');
      }
      return line;
    });
    fs.writeFileSync(TRACKER, updated.join('\n'));
  } catch {}
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

const done = readDoneSet();
console.log('[outreach] Ja processados (skip):', done.size, 'targets');
const targets = TARGETS.filter(t => !done.has(t.name));
console.log('[outreach] A processar:', targets.length, 'targets');

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1280, height: 850 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

console.log('[outreach] Verificando sessao...');
await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
if (page.url().includes('/login') || page.url().includes('/authwall')) {
  console.log('[outreach] Sessao expirou — a aguardar login na janela...');
  let ok = false;
  for (let i = 0; i < 120; i++) {
    await sleep(5000);
    const u = page.url();
    if (!u.includes('/login') && !u.includes('/authwall')) { ok = true; break; }
  }
  if (!ok) throw new Error('Login timeout');
}
console.log('[outreach] Sessao OK.');

const results = [];
let sent = 0, pending = 0, failed = 0;

for (const t of targets) {
  console.log(`\n[outreach] ${targets.indexOf(t) + 1}/${targets.length}: ${t.name}`);
  const entry = { target: t.name, profile: null, action: null };
  try {
    await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(t.search), {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await page.waitForTimeout(4500);
    await removeOverlays(page);

    const href = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
      for (const l of links) {
        const h = l.getAttribute('href');
        if (h && h.includes('/in/')) return h;
      }
      return null;
    });
    if (!href) throw new Error('Sem resultados');

    const profileUrl = (href.startsWith('http') ? href : 'https://www.linkedin.com' + href).replace(/\?trk=.*$/, '');
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
    await removeOverlays(page);
    await sleep(1000);

    entry.profile = profileUrl;

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

    if (composeHref) {
      await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(7000);
      await removeOverlays(page);

      const editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 15000 }).catch(() => null);
      if (!editor) throw new Error('Editor visivel nao encontrado');
      await editor.click();
      await sleep(500);
      await typeText(page, note);
      await sleep(1000);

      // Send button: msg-form__send-btn (icon, no text/aria)
      const sendRect = await page.evaluate(() => {
        const vis = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
        };
        const btns = Array.from(document.querySelectorAll('button')).filter(vis);
        const b = btns.find(x => (x.className || '').includes('msg-form__send-btn')) 
               || btns.find(x => /^(enviar|send)$/i.test((x.textContent || '').trim()));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (!sendRect) throw new Error('Botao enviar nao encontrado');
      await page.mouse.click(sendRect.x, sendRect.y);
      await sleep(3000);

      // Verify: editor cleared or compose gone
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
      entry.action = 'message-sent:' + cleared;
      updateTracker(t.name, 'Sent (message)');
      sent++;
    } else {
      const state = await page.evaluate(() => {
        const vis = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
        };
        const texts = Array.from(document.querySelectorAll('button, a')).filter(vis)
          .map(e => (e.textContent || '').trim().replace(/\s+/g, ' '))
          .filter(t => t.length > 0 && t.length < 30);
        const unique = texts.filter((v, i, a) => a.indexOf(v) === i);
        if (unique.some(t => /^pendente$/i.test(t))) return 'PENDING';
        if (unique.some(t => /^(ligar|conectar|connect)$/i.test(t))) return 'CONNECT';
        if (unique.some(t => /^seguir$/i.test(t))) return 'FOLLOW';
        return 'OTHER:' + unique.slice(0, 5).join('|');
      });
      console.log(`  (sem compose) estado: ${state}`);

      if (state === 'PENDING') {
        entry.action = 'pending';
        updateTracker(t.name, 'Pending');
        pending++;
        console.log('  — ja pendente');
      } else if (state === 'CONNECT') {
        const rect = await page.evaluate(() => {
          const vis = el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
          };
          const els = Array.from(document.querySelectorAll('button, a'));
          const target = els.find(e => vis(e) && /^(ligar|conectar|connect)$/i.test((e.textContent || '').trim()));
          if (!target) return null;
          const r = target.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
        if (!rect) throw new Error('Botao Ligar nao encontrado');
        await page.mouse.click(rect.x, rect.y);
        await sleep(3500);
        await removeOverlays(page);

        const noteToggle = await page.evaluate(() => {
          const vis = el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
          };
          const dlg = Array.from(document.querySelectorAll('[role="dialog"]')).find(vis);
          if (!dlg) return null;
          const b = Array.from(dlg.querySelectorAll('button')).find(x => /nota|note|personaliz/i.test((x.textContent || '').trim()));
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
        if (noteToggle) {
          await page.mouse.click(noteToggle.x, noteToggle.y);
          await sleep(2000);
          const ta = await page.$('[role="dialog"] textarea, [role="dialog"] [contenteditable="true"]');
          if (ta && await ta.isVisible().catch(() => false)) {
            await ta.click();
            await sleep(300);
            await typeText(page, note);
            await sleep(400);
          }
        }
        const sendRect = await page.evaluate(() => {
          const vis = el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
          };
          const dlg = Array.from(document.querySelectorAll('[role="dialog"]')).find(vis);
          if (!dlg) return null;
          const b = Array.from(dlg.querySelectorAll('button')).find(x => /^(enviar|send)$/i.test((x.textContent || '').trim()));
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
        if (sendRect) {
          await page.mouse.click(sendRect.x, sendRect.y);
          await sleep(2000);
        }
        await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);
        await removeOverlays(page);
        const after = await page.evaluate(() => {
          const vis = el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
          };
          const texts = Array.from(document.querySelectorAll('button, a')).filter(vis)
            .map(e => (e.textContent || '').trim()).filter(t => /pendente|conectar|ligar/i.test(t));
          return texts.slice(0, 3);
        });
        if (after.some(t => /pendente/i.test(t))) {
          console.log('  ✓ CONVITE ENVIADO (verificado)');
          entry.action = 'connect-sent';
          updateTracker(t.name, 'Sent (connect)');
          sent++;
        } else {
          console.log(`  ? Estado: ${JSON.stringify(after)}`);
          entry.action = 'connect-unverified';
          updateTracker(t.name, 'Connect?');
          sent++;
        }
      } else {
        const rect = await page.evaluate(() => {
          const vis = el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
          };
          const els = Array.from(document.querySelectorAll('button, a'));
          const target = els.find(e => vis(e) && /^seguir$/i.test((e.textContent || '').trim()));
          if (!target) return null;
          const r = target.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
        if (rect) {
          await page.mouse.click(rect.x, rect.y);
          await sleep(2000);
          entry.action = 'followed';
          updateTracker(t.name, 'Followed');
          console.log('  — Seguir clicado');
        } else {
          throw new Error('Sem acao: ' + state);
        }
      }
    }

    results.push(entry);
    const delay = 10000 + Math.random() * 8000;
    await sleep(delay);
  } catch (err) {
    console.log(`  ✗ FALHOU: ${err.message}`);
    entry.action = 'failed: ' + err.message.slice(0, 60);
    updateTracker(t.name, `Failed: ${err.message.slice(0, 40)}`);
    failed++;
    results.push(entry);
    await sleep(2000);
  }
}

fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
console.log(`\n[outreach] ===== COMPLETO =====`);
console.log(`  Enviados: ${sent} | Ja pendentes: ${pending} | Falhados: ${failed} | Total processados: ${targets.length}`);
await sleep(5000);
await browser.close();
