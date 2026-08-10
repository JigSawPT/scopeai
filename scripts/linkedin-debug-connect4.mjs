import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findButton(page, labels, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const btns = await page.$$('button, [role="button"], a, [role="menuitem"]');
    for (const b of btns) {
      try {
        const text = ((await b.textContent()) || '').trim().toLowerCase();
        const aria = ((await b.getAttribute('aria-label')) || '').toLowerCase();
        for (const label of labels) {
          if (text === label.toLowerCase() || text.startsWith(label.toLowerCase() + ' ') || aria === label.toLowerCase() || aria.includes(label.toLowerCase())) {
            return b;
          }
        }
      } catch {}
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

// Step 1: look for direct Connect/Ligar button
let connectBtn = await findButton(page, ['connect', 'ligar'], 3000);
console.log('direct connect:', connectBtn ? 'found' : 'not found');

// Step 2: if not found, open More menu with REAL click
if (!connectBtn) {
  const moreBtn = await findButton(page, ['mais', 'more'], 3000);
  if (moreBtn) {
    await moreBtn.click();
    await page.waitForTimeout(2000);
    console.log('more menu opened');
    connectBtn = await findButton(page, ['conectar', 'connect'], 3000);
    console.log('connect in menu:', connectBtn ? 'found' : 'not found');
  }
}

if (connectBtn) {
  await connectBtn.click();
  await page.waitForTimeout(3500);
  console.log('clicked connect, url:', page.url());

  // Inspect dialog
  const dlg = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"], .artdeco-modal');
    return d ? d.innerText.slice(0, 600) : 'no dialog';
  });
  console.log('dialog:', JSON.stringify(dlg.slice(0, 400)));

  // Look for "Add a note" toggle with real click
  const noteBtn = await findButton(page, ['adicionar nota', 'add a note', 'personalizar convite', 'personalize invitation'], 4000);
  console.log('note toggle:', noteBtn ? 'found' : 'not found');
  if (noteBtn) {
    await noteBtn.click();
    await page.waitForTimeout(2000);
  }

  // Find textarea/editor
  const ta = await page.$('[role="dialog"] textarea, [role="dialog"] [contenteditable="true"], textarea, div[contenteditable="true"]');
  console.log('textarea:', ta ? 'found' : 'not found');
  if (ta) {
    await ta.click();
    await sleep(300);
    const note = 'Hi Wasam — I built ScopeAI: AI agents that produce competitive intelligence reports in ~3 min with live web citations. Thought it could help with SaaS growth marketing. Demo: https://scopeai-746706977308.us-central1.run.app/demo';
    for (const char of note) {
      await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
    }
    await sleep(500);
    const sendBtn = await findButton(page, ['enviar', 'send'], 4000);
    console.log('send btn:', sendBtn ? 'found' : 'not found');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(2500);
      console.log('✓ SEND CLICKED — connecting request sent (verify visually)');
    }
  }
} else {
  console.log('NO connect button anywhere');
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('body:', JSON.stringify(bodyText.slice(0, 250)));
}

await page.waitForTimeout(3000);
await browser.close();
