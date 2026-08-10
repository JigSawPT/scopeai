import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/zehfernandes/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// Accept cookies if banner present
const cookieAccepted = await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /^aceitar$/i.test((x.textContent || '').trim()));
  if (!b) return false;
  b.click();
  return true;
});
console.log('cookies accepted:', cookieAccepted);
await page.waitForTimeout(2000);

// Dismiss "app" prompt if present
await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /continuar com a versão web/i.test((x.textContent || '').trim()));
  if (b) b.click();
});
await page.waitForTimeout(1500);

// Click Conectar (visible)
const clicked = await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /^(conectar|connect|ligar)$/i.test((x.textContent || '').trim()));
  if (!b) return null;
  b.click();
  return (b.textContent || '').trim();
});
console.log('clicked:', clicked);
await page.waitForTimeout(3000);

// Look for "Add a note" toggle inside the dialog
const noteToggle = await page.evaluate(() => {
  const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /adicionar nota|add a note|personalizar/i.test((x.textContent || '').trim()));
  if (!b) return false;
  b.click();
  return true;
});
console.log('note toggle:', noteToggle);
await page.waitForTimeout(2000);

const ta = await page.$('textarea, [contenteditable="true"]');
console.log('textarea:', ta ? 'found' : 'not found');
if (ta) {
  await ta.click();
  await sleep(300);
  const note = 'Hi Zeh — I built ScopeAI: AI agents that produce competitive intelligence reports in ~3 min with live web citations. Thought it could help Resend vs SendGrid/Postmark. Demo: https://scopeai-746706977308.us-central1.run.app/demo';
  for (const char of note) {
    await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
  }
  await sleep(500);

  const sendClicked = await page.evaluate(() => {
    const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    const b = Array.from(document.querySelectorAll('button')).find(x => vis(x) && /^(enviar|send)$/i.test((x.textContent || '').trim()));
    if (!b) return false;
    b.click();
    return true;
  });
  console.log('send clicked:', sendClicked);
  await page.waitForTimeout(3000);

  // Check result
  const result = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(vis);
    return {
      dialogsOpen: dialogs.length,
      sentText: /convite enviado|invitation sent|solicitação enviada/i.test(bodyText) ? 'YES' : 'no',
      snippet: bodyText.match(/.{0,60}(convite enviado|solicitação enviada|invitation sent).{0,60}/i)?.[0] || '',
    };
  });
  console.log('result:', JSON.stringify(result));
}

await page.waitForTimeout(3000);
await browser.close();
