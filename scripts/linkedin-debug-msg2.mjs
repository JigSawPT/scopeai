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

await page.goto('https://www.linkedin.com/in/ctfrantz', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000);

// Get the Mensagem element's center coordinates
const rect = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const els = Array.from(document.querySelectorAll('a, button, [role="button"], div, span'));
  const m = els.find(e => vis(e) && (e.textContent || '').trim() === 'Mensagem' && e.children.length <= 1);
  if (!m) return null;
  const r = m.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
});
console.log('Mensagem rect:', JSON.stringify(rect));

if (rect) {
  await page.mouse.click(rect.x, rect.y);  // TRUSTED click at coordinates
  await sleep(6000);
  console.log('url:', page.url());

  const state = await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const editors = Array.from(document.querySelectorAll('textarea, div[contenteditable="true"], [data-lexical-editor]')).filter(vis)
      .map(e => e.tagName + '.' + (e.className || '').slice(0, 40));
    const senders = Array.from(document.querySelectorAll('button, [role="button"]')).filter(vis)
      .map(b => (b.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(t => /enviar|send/i.test(t)).slice(0, 3);
    const bodyText = document.body.innerText;
    return { editors, senders, hasChat: /escrever uma mensagem|escrever mensagem|write a message/i.test(bodyText) };
  });
  console.log('visible editors:', JSON.stringify(state.editors));
  console.log('send buttons:', JSON.stringify(state.senders));
  console.log('chat placeholder present:', state.hasChat);
}

await browser.close();
