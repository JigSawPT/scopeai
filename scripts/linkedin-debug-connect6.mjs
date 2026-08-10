import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/wasambashir/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

// Remove overlay
await page.evaluate(() => {
  document.querySelectorAll('[class*="_59d7812b"]').forEach(el => el && el.parentNode && el.parentNode.removeChild(el));
});

// List all buttons with data-control-name in the profile area
const controls = await page.evaluate(() =>
  Array.from(document.querySelectorAll('main [data-control-name]'))
    .map(e => e.getAttribute('data-control-name'))
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .slice(0, 30)
);
console.log('data-control-name attrs:', JSON.stringify(controls));

// Try the More button via data-control-name
const moreBtn = await page.$('[data-control-name="profile.more"], [data-control-name="profile_actions.more"]');
console.log('more btn via control-name:', moreBtn ? 'found' : 'not found');

if (moreBtn) {
  await moreBtn.click();
  await page.waitForTimeout(2000);
  const menuText = await page.evaluate(() => {
    const d = document.querySelector('[role="menu"], .artdeco-dropdown__content');
    return d ? d.innerText.slice(0, 400) : 'no menu';
  });
  console.log('menu:', JSON.stringify(menuText.slice(0, 300)));

  const connectItem = await page.$('[role="menu"] [role="menuitem"]:has-text("Conectar"), [role="menu"] [role="menuitem"]:has-text("Connect")');
  console.log('connect item:', connectItem ? 'found' : 'not found');
  if (connectItem) {
    await connectItem.click();
    await page.waitForTimeout(3500);

    const dialogText = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"], .artdeco-modal');
      return d ? d.innerText.slice(0, 500) : 'no dialog';
    });
    console.log('dialog:', JSON.stringify(dialogText.slice(0, 350)));

    // note toggle
    const noteBtn = await page.$('[role="dialog"] button:has-text("nota"), [role="dialog"] button:has-text("note")');
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
      const sendBtn = await page.$('[role="dialog"] button:has-text("Enviar"), [role="dialog"] button:has-text("Send")');
      console.log('send btn:', sendBtn ? 'found' : 'not found');
      if (sendBtn) {
        await sendBtn.click();
        await page.waitForTimeout(2500);
        console.log('✓ CONNECT+NOTE SENT');
      }
    }
  }
} else {
  // fallback: look for Connect button directly
  const connectBtn = await page.$('[data-control-name="profile.connect"], button:has-text("Ligar"), button:has-text("Connect")');
  console.log('direct connect:', connectBtn ? 'found' : 'not found');
  if (connectBtn) {
    await connectBtn.click();
    await page.waitForTimeout(3000);
    console.log('direct connect clicked');
    const dlg = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? d.innerText.slice(0, 300) : 'no dialog';
    });
    console.log('dialog:', JSON.stringify(dlg.slice(0, 250)));
  }
}

await page.waitForTimeout(2000);
await browser.close();
