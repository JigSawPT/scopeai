import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { name: 'Mangools', search: 'Mangools SEO', ctx: 'SEO tools vs Ahrefs/SEMrush/Moz' },
  { name: 'Attio', search: 'Attio CRM', ctx: 'next-gen CRM vs HubSpot/Salesforce' },
  { name: 'Socialinsider', search: 'Socialinsider', ctx: 'social media analytics vs Sprout/Hootsuite' },
  { name: 'Andy Crestodina', search: 'Andy Crestodina', ctx: 'content marketing and competitive research' },
];

function shortNote(firstName, ctx) {
  const note = `Hi ${firstName} — I built ScopeAI: AI agents that produce competitive intelligence reports in ~3 minutes with live web citations. Thought it could help with ${ctx}. Demo: https://scopeai-746706977308.us-central1.run.app/demo`;
  return note.length > 290 ? note.slice(0, 287) + '...' : note;
}

async function clickByTextVisible(page, re) {
  return page.evaluate((re) => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const btns = Array.from(document.querySelectorAll('button, [role="button"]')).filter(vis);
    const b = btns.find(x => re.test((x.textContent || '').trim()));
    if (!b) return false;
    b.click();
    return true;
  }, re);
}

async function cleanPage(page) {
  await clickByTextVisible(page, /^aceitar$/i).catch(() => {});  // cookie consent
  await sleep(800);
  await page.evaluate(() => {
    document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
  });
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(600);
  }
  await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const b = Array.from(document.querySelectorAll('button')).filter(vis)
      .find(x => /fechar|close|dismiss/i.test((x.getAttribute('aria-label') || '')));
    if (b) b.click();
  });
  await sleep(800);
}

async function typeText(page, text) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
  }
}

async function conversationExists(page, firstName) {
  await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  await cleanPage(page);
  const found = await page.evaluate((firstName) => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const items = Array.from(document.querySelectorAll('.msg-conversation-listitem__link, a[href*="/messaging/thread/"]')).filter(vis);
    return items.some(i => {
      const t = (i.textContent || '').toLowerCase();
      return t.includes(firstName.toLowerCase()) && t.includes('você:');
    });
  }, firstName);
  return found;
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
  console.log(`\n[final] ${t.name}`);
  try {
    await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(t.search), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4500);
    await cleanPage(page);
    const href = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
      for (const l of links) { const h = l.getAttribute('href'); if (h && h.includes('/in/')) return h; }
      return null;
    });
    if (!href) throw new Error('Sem resultados');
    const profileUrl = (href.startsWith('http') ? href : 'https://www.linkedin.com' + href).replace(/\?trk=.*$/, '');

    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
    await cleanPage(page);

    const realFirst = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? (h1.textContent || '').trim().split(' ')[0] : null;
    });
    const firstName = realFirst || 'there';
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

    let editor = null;
    for (let attempt = 1; attempt <= 3 && !editor; attempt++) {
      await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(8000);
      await cleanPage(page);
      editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 12000 }).catch(() => null);
      if (!editor) console.log(`  attempt ${attempt}: sem editor`);
    }
    if (!editor) throw new Error('Editor bloqueado (paywall?)');

    await editor.click();
    await sleep(500);
    await typeText(page, note);
    await sleep(1200);

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
    await sleep(4000);

    const verified = await conversationExists(page, firstName);
    if (verified) {
      console.log(`  ✓ MENSAGEM CONFIRMADA (${firstName})`);
      sent++;
    } else {
      console.log(`  ? Enviada mas nao encontrada na 1a pagina (verificar) — ${firstName}`);
      sent++;
    }
    await sleep(6000);
  } catch (err) {
    console.log(`  ✗ FALHOU: ${err.message}`);
    failed++;
    await sleep(2000);
  }
}

console.log(`\n[final] COMPLETO: ${sent} enviadas, ${failed} falhadas`);
await sleep(3000);
await browser.close();
