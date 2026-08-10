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

// What element is "Mensagem"?
const msgEl = await page.evaluate(() => {
  const vis = el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
  };
  const els = Array.from(document.querySelectorAll('a, button, [role="button"], div, span'));
  const m = els.find(e => vis(e) && (e.textContent || '').trim() === 'Mensagem' && e.children.length <= 1);
  if (!m) return null;
  return { tag: m.tagName, href: m.getAttribute('href'), role: m.getAttribute('role'), cls: (m.className || '').slice(0, 60) };
});
console.log('Mensagem element:', JSON.stringify(msgEl));

// Click it (real click)
if (msgEl) {
  await page.evaluate(() => {
    const vis = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0;
    };
    const els = Array.from(document.querySelectorAll('a, button, [role="button"], div, span'));
    const m = els.find(e => vis(e) && (e.textContent || '').trim() === 'Mensagem' && e.children.length <= 1);
    if (m) m.click();
  });
  await sleep(4000);
  console.log('url after click:', page.url());

  const editor = await page.$('textarea, div[contenteditable="true"], [data-lexical-editor]').catch(() => null);
  console.log('editor:', editor ? 'found' : 'not found');

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('body:', JSON.stringify(bodyText.slice(0, 300)));

  const sendVisible = await page.evaluate(() => {
    const vis = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    return Array.from(document.querySelectorAll('button')).filter(vis).some(b => /enviar|send/i.test((b.textContent || '').trim()));
  });
  console.log('send visible:', sendVisible);
}

await browser.close();
