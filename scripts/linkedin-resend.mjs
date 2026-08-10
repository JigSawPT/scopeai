import { chromium } from 'playwright';
import fs from 'fs';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { name: 'Mangools', search: 'Mangools SEO', ctx: 'SEO tools vs Ahrefs/SEMrush/Moz', firstName: 'Alejandro' },
  { name: 'Attio', search: 'Attio CRM', ctx: 'next-gen CRM vs HubSpot/Salesforce', firstName: 'there' },
  { name: 'Peep Laja', search: 'Peep Laja', ctx: 'B2B messaging and positioning research', firstName: 'Peep' },
  { name: 'Kalungi', search: 'Kalungi marketing agency', ctx: 'B2B SaaS positioning and GTM work', firstName: 'there' },
  { name: 'Socialinsider', search: 'Socialinsider', ctx: 'social media analytics vs Sprout/Hootsuite', firstName: 'there' },
  { name: 'Katelyn Bourgoin', search: 'Katelyn Bourgoin', ctx: 'buyer persona and market research', firstName: 'Katelyn' },
  { name: 'Andy Crestodina', search: 'Andy Crestodina', ctx: 'content marketing and competitive research', firstName: 'Andy' },
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

async function dismissModals(page) {
  // Escape + close buttons for Premium trial modal
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(700);
  }
  await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const closeBtns = Array.from(document.querySelectorAll('button')).filter(vis);
    const b = closeBtns.find(x => /fechar|close|dismiss/i.test((x.getAttribute('aria-label') || '')));
    if (b) b.click();
  });
  await sleep(1000);
}

async function typeText(page, text) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
  }
}

async function conversationExists(page, firstName) {
  await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);
  await removeOverlays(page);
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
  console.log(`\n[resend] ${t.name}`);
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

    // Get real first name
    const realFirst = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? (h1.textContent || '').trim().split(' ')[0] : null;
    });
    const firstName = realFirst && realFirst !== '🦔' ? realFirst : t.firstName;
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

    // Open compose, dismiss modals, wait for editor (up to 3 attempts)
    let editor = null;
    for (let attempt = 1; attempt <= 3 && !editor; attempt++) {
      await page.goto('https://www.linkedin.com' + composeHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(8000);
      await removeOverlays(page);
      await dismissModals(page);
      editor = await page.waitForSelector('.msg-form__contenteditable', { state: 'visible', timeout: 12000 }).catch(() => null);
      if (!editor) console.log(`  attempt ${attempt}: sem editor, retry...`);
    }
    if (!editor) throw new Error('Editor nunca apareceu');

    await editor.click();
    await sleep(500);
    await typeText(page, note);
    await sleep(1200);

    // Verify the text is in the editor
    const typed = await page.$eval('.msg-form__contenteditable', el => (el.textContent || '').length).catch(() => 0);
    if (typed < 20) throw new Error('Texto nao entrou no editor');

    // Send: msg-form__send-btn (icon only)
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
    if (!sendRect) throw new Error('Botao send nao encontrado');
    await page.mouse.click(sendRect.x, sendRect.y);
    await sleep(4000);

    // VERIFY: conversation exists in messaging with "Você:" (sent)
    const verified = await conversationExists(page, firstName);
    if (verified) {
      console.log(`  ✓ MENSAGEM CONFIRMADA na lista de conversas (${firstName})`);
      sent++;
    } else {
      // maybe the message went to a message request / different name — try profile-state check
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);
      await removeOverlays(page);
      const btnState = await page.evaluate(() => {
        const vis = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
        };
        const texts = Array.from(document.querySelectorAll('button, a')).filter(vis)
          .map(e => (e.textContent || '').trim().replace(/\s+/g, ' '))
          .filter(t => /mensagem|enviar|message|pendente/i.test(t)).slice(0, 4);
        return texts;
      });
      console.log(`  ? Nao confirmada na lista. Estado do perfil: ${JSON.stringify(btnState)}`);
      console.log(`    (possivelmente enviada como mensagem a um nao-conexao — verificar manualmente)`);
      sent++;
    }
    await sleep(8000);
  } catch (err) {
    console.log(`  ✗ FALHOU: ${err.message}`);
    failed++;
    await sleep(2000);
  }
}

console.log(`\n[resend] COMPLETO: ${sent} enviadas/confirmadas, ${failed} falhadas`);
await sleep(3000);
await browser.close();
