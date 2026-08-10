import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

// Search for a founder with a standard profile
await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent('Zeh Fernandes Resend'), {
  waitUntil: 'domcontentloaded', timeout: 30000
});
await page.waitForTimeout(4000);

const href = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
  for (const l of links) {
    const h = l.getAttribute('href');
    if (h && h.includes('/in/')) return h;
  }
  return null;
});
console.log('found profile:', href);

await page.goto(href.startsWith('http') ? href : 'https://www.linkedin.com' + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

// List primary action buttons in main
const actions = await page.evaluate(() => {
  const main = document.querySelector('main');
  if (!main) return [];
  return Array.from(main.querySelectorAll('button'))
    .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 0 && t.length < 30)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 12);
});
console.log('main buttons:', JSON.stringify(actions));

// Click Ligar / Conectar / Connect (primary)
const clicked = await page.evaluate(() => {
  const main = document.querySelector('main');
  const btns = Array.from(main.querySelectorAll('button'));
  const b = btns.find(x => /^(ligar|conectar|connect)$/i.test((x.textContent || '').trim()));
  if (!b) return null;
  b.click();
  return (b.textContent || '').trim();
});
console.log('clicked:', clicked);
await page.waitForTimeout(3500);

// Inspect whatever appeared
const info = await page.evaluate(() => {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], [class*="modal"]'));
  const texts = dialogs.map(d => (d.innerText || '').slice(0, 400));
  const bodyText = document.body.innerText;
  const notaIdx = bodyText.search(/adicionar nota|add a note|personaliz/i);
  return {
    dialogCount: dialogs.length,
    dialogTexts: texts,
    hasNota: notaIdx !== -1,
    notaSnippet: notaIdx !== -1 ? bodyText.slice(Math.max(0, notaIdx - 150), notaIdx + 200) : '',
    toast: bodyText.match(/.{0,80}(convite|invitation|solicita|enviad).{0,80}/i)?.[0] || null,
  };
});
console.log('dialogs:', info.dialogCount);
console.log('dialog texts:', JSON.stringify(info.dialogTexts));
console.log('hasNota:', info.hasNota, '| notaSnippet:', JSON.stringify(info.notaSnippet.slice(0, 200)));
console.log('toast:', JSON.stringify(info.toast));

// If a connect dialog is open, find textarea and confirm
if (info.dialogCount > 0) {
  const ta = await page.$('[role="dialog"] textarea, [role="dialog"] [contenteditable="true"], textarea');
  console.log('textarea:', ta ? 'found' : 'not found');
  if (ta) {
    await ta.click();
    await sleep(300);
    const note = 'Hi Zeh — Resend is API-first email infra competing with SendGrid and Postmark. I built ScopeAI, an AI competitive intelligence tool (~3 min per report, live web citations). Would love your feedback. Demo: https://scopeai-746706977308.us-central1.run.app/demo';
    for (const char of note) {
      await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
    }
    await sleep(500);
    const sendClicked = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"], [aria-modal="true"]');
      if (!d) return false;
      const b = Array.from(d.querySelectorAll('button')).find(x => /enviar|send/i.test((x.textContent || '').trim()));
      if (!b) return false;
      b.click();
      return true;
    });
    console.log('send clicked:', sendClicked);
    await page.waitForTimeout(2500);
    console.log('FLOW TESTADO — verifica visualmente se o convite foi enviado');
  }
}

await page.waitForTimeout(3000);
await browser.close();
