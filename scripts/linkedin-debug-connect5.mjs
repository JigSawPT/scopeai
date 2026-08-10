import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function removeOverlays(page) {
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('[class*="_59d7812b"], .artdeco-toast, [data-test-id="banner"]');
    overlays.forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  });
}

async function findButtonScoped(page, labels, scope, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const btns = await page.evaluate((sel) => {
      const root = document.querySelector(sel) || document;
      return Array.from(root.querySelectorAll('button, [role="button"], a, [role="menuitem"]')).map(b => ({
        text: (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        aria: b.getAttribute('aria-label') || '',
        id: b.id,
      }));
    }, scope);
    for (const b of btns) {
      const lower = (b.text + ' ' + b.aria).toLowerCase();
      for (const label of labels) {
        if (lower.includes(label)) {
          const handle = await page.evaluateHandle((sel, { text, aria }) => {
            const root = document.querySelector(sel) || document;
            return Array.from(root.querySelectorAll('button, [role="button"], a, [role="menuitem"]')).find(x =>
              ((x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + ' ' + (x.getAttribute('aria-label') || '')).toLowerCase().includes(text) ||
              ((x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + ' ' + (x.getAttribute('aria-label') || '')).toLowerCase().includes(aria)
            );
          }, scope, b);
          const el = handle.asElement();
          if (el) return el;
        }
      }
    }
    await sleep(500);
  }
  return null;
}

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/wasambashir/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
await removeOverlays(page);

// Find the profile section scope
const profileScope = await page.evaluate(() => {
  const s = document.querySelector('section[data-view-name="profile"], section[class*="profile"]');
  return s ? 'section[data-view-name="profile"]' : 'main';
});
console.log('scope:', profileScope);

// Try direct Connect/Ligar in profile scope
let connectBtn = await findButtonScoped(page, ['ligar', 'connect'], profileScope, 3000);
console.log('direct connect:', connectBtn ? 'found' : 'not found');

if (!connectBtn) {
  const moreBtn = await findButtonScoped(page, ['mais', 'more'], profileScope, 3000);
  console.log('more btn:', moreBtn ? 'found' : 'not found');
  if (moreBtn) {
    await moreBtn.click();
    await page.waitForTimeout(2000);
    connectBtn = await findButtonScoped(page, ['conectar', 'connect'], '[role="menu"], .artdeco-dropdown__content', 3000);
    console.log('connect in menu:', connectBtn ? 'found' : 'not found');
  }
}

if (connectBtn) {
  await connectBtn.click();
  await page.waitForTimeout(3500);
  console.log('connect clicked, url:', page.url());

  const dlg = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"], .artdeco-modal');
    return d ? d.innerText.slice(0, 600) : 'no dialog';
  });
  console.log('dialog:', JSON.stringify(dlg.slice(0, 400)));

  const noteBtn = await findButtonScoped(page, ['adicionar nota', 'add a note', 'personalizar'], '[role="dialog"], .artdeco-modal', 4000);
  console.log('note toggle:', noteBtn ? 'found' : 'not found');
  if (noteBtn) {
    await noteBtn.click();
    await page.waitForTimeout(2000);
  }

  const ta = await page.$('[role="dialog"] textarea, [role="dialog"] [contenteditable="true"]');
  console.log('textarea:', ta ? 'found' : 'not found');
  if (ta) {
    await ta.click();
    await sleep(300);
    const note = 'Hi Wasam — I built ScopeAI: AI agents that produce competitive intelligence reports in ~3 min with live web citations. Thought it could help with SaaS growth marketing. Demo: https://scopeai-746706977308.us-central1.run.app/demo';
    for (const char of note) {
      await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
    }
    await sleep(500);
    const sendBtn = await findButtonScoped(page, ['enviar', 'send'], '[role="dialog"], .artdeco-modal', 4000);
    console.log('send btn:', sendBtn ? 'found' : 'not found');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(2500);
      console.log('✓ CONNECT+NOTE SENT (verify visually)');
    }
  }
} else {
  console.log('NO connect button');
}

await page.waitForTimeout(3000);
await browser.close();
