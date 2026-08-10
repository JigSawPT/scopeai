import { chromium } from 'playwright';

const SESSION = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';

const browser = await chromium.launchPersistentContext(SESSION, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = browser.pages()[0] || await browser.newPage();

await page.goto('https://www.linkedin.com/in/wasambashir/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

// Extract memberId from the page
const memberId = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const m = html.match(/"memberId":"(\d+)"/);
  if (m) return m[1];
  const m2 = html.match(/"voyagerIdentity":\{"entityUrn":"urn:li:fsd_profile:(\d+)/);
  if (m2) return m2[1];
  const m3 = html.match(/urn:li:fsd_profile:(\d+)/);
  if (m3) return m3[1];
  return null;
});
console.log('memberId:', memberId);

if (memberId) {
  await page.goto(`https://www.linkedin.com/messaging/compose/?recipient=${memberId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('compose url:', page.url());

  const editors = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div[contenteditable="true"], textarea, [data-lexical-editor], div[role="textbox"]'))
      .map(e => e.tagName + '.' + (e.className || '').slice(0, 60))
  );
  console.log('editors:', JSON.stringify(editors));

  const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 500) : '');
  console.log('body:', JSON.stringify(bodyText.slice(0, 400)));

  const sendBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .map(b => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
      .filter(t => /enviar|send/i.test(t))
  );
  console.log('send buttons:', JSON.stringify(sendBtns));
}

await browser.close();
