import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function btnInMain(page, label, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const found = await page.evaluate((label) => {
      const main = document.querySelector('main');
      if (!main) return null;
      const btns = Array.from(main.querySelectorAll('button'));
      for (const b of btns) {
        const t = (b.textContent || '').trim().replace(/\s+/g, ' ');
        if (t === label || t.startsWith(label + ' ')) {
          const r = b.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        }
      }
      return null;
    }, label);
    if (found) {
      return page.evaluateHandle((label) => {
        const main = document.querySelector('main');
        const btns = Array.from(main.querySelectorAll('button'));
        return btns.find(b => {
          const t = (b.textContent || '').trim().replace(/\s+/g, ' ');
          return t === label || t.startsWith(label + ' ');
        });
      }, label);
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

// Remove floating overlay
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

const connectBtn = await btnInMain(page, 'Ligar', 3000).catch(() => null);
console.log('Ligar in main:', connectBtn ? 'found' : 'not found');

let target = connectBtn;
if (!target) {
  const maisBtn = await btnInMain(page, 'Mais', 3000).catch(() => null);
  console.log('Mais in main:', maisBtn ? 'found' : 'not found');
  if (maisBtn) {
    await maisBtn.asElement().click();
    await page.waitForTimeout(2000);
    // Now look for Conectar in the dropdown (menu is appended to body usually)
    const item = await page.evaluateHandle(() => {
      const menu = document.querySelector('[role="menu"]');
      if (!menu) return null;
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      return items.find(i => /conectar|connect/i.test(i.textContent || ''));
    });
    if (item) {
      await item.asElement().click();
      target = item;
      console.log('Conectar from menu: clicked');
    } else {
      console.log('Conectar not in menu');
    }
  }
}

if (target) {
  await page.waitForTimeout(3000);
  // inspect dialog
  const dlg = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"], .artdeco-modal');
    return d ? d.innerText.slice(0, 400) : 'no dialog';
  });
  console.log('dialog:', JSON.stringify(dlg.slice(0, 300)));

  const noteBtn = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"], .artdeco-modal');
    if (!d) return null;
    const btns = Array.from(d.querySelectorAll('button'));
    const b = btns.find(x => /nota|note|personaliz/i.test(x.textContent || ''));
    if (!b) return null;
    b.click();
    return true;
  });
  console.log('note toggle clicked:', noteBtn);
  await page.waitForTimeout(2000);

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
    const sendBtn = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"], .artdeco-modal');
      if (!d) return null;
      const btns = Array.from(d.querySelectorAll('button'));
      const b = btns.find(x => /enviar|send/i.test((x.textContent || '').trim()));
      if (!b) return null;
      b.click();
      return true;
    });
    console.log('send clicked:', sendBtn);
    await page.waitForTimeout(2500);
    console.log('✓ FLOW COMPLETO (verifica visualmente)');
  }
}

await page.waitForTimeout(2000);
await browser.close();
