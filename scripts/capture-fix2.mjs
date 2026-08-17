import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://scopeai-746706977308.us-central1.run.app';
const OUT = 'video/capture-new';
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// 1) Trigger demo + capture telemetry (wait for page load before recording)
console.log('--- TELEMETRY ---');
const trig = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const tp = await trig.newPage();
await tp.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 60000 });
await sleep(2000);
await tp.locator('text=Artisanal Specialty Coffee').first().click();
await sleep(800);

let data = null;
for (let attempt = 1; attempt <= 4 && !data; attempt++) {
  const respPromise = tp.waitForResponse(r => r.url().includes('/api/analyze'), { timeout: 30000 });
  await tp.locator('text=Run Live Analysis').click();
  const r = await respPromise.catch(() => null);
  if (r && r.status() === 200) { data = await r.json(); break; }
  const err = r ? await r.json().catch(() => ({})) : {};
  console.log(`attempt ${attempt}: status=${r ? r.status() : 'none'} ${err.error || ''}`);
  const m = (err.error || '').match(/(\d+) minutes/);
  await sleep((m ? parseInt(m[1]) + 1 : 5) * 60000);
  await tp.reload({ waitUntil: 'networkidle' });
  await sleep(1500);
  await tp.locator('text=Artisanal Specialty Coffee').first().click();
  await sleep(600);
}
if (!data) throw new Error('Pipeline launch failed');
const reportUrl = `${BASE}/report/${data.order_id}?access=${data.access_token}`;
console.log('pipeline:', data.order_id);
await trig.close();

// Pre-load page WITHOUT recording to avoid blank frames
const preload = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const pp = await preload.newPage();
await pp.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
// Wait for actual content to appear (not just the loading spinner)
await pp.waitForFunction(() => {
  const text = document.body.innerText;
  return text.includes('events logged') || text.includes('Running') || text.includes('Completed');
}, { timeout: 30000 });
console.log('preload: content visible');
await preload.close();

// Now record — page loads fast from cache, content appears immediately
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
// Wait for content to be visible before the recording captures meaningful frames
await page.waitForFunction(() => {
  const text = document.body.innerText;
  return text.includes('events logged') || text.includes('Running') || text.includes('Completed');
}, { timeout: 15000 });

const start = Date.now();
let done = false;
while (Date.now() - start < 400000) {
  const state = await page.evaluate(() => ({
    complete: document.body.innerText.includes('Complete Generated Report'),
  })).catch(() => ({ complete: false }));
  if (state.complete) { done = true; break; }
  await sleep(3000);
}
console.log('telemetry done:', done, 'elapsed:', Math.round((Date.now() - start) / 1000), 's');
await sleep(4000);
await ctx.close();
const vp = await page.video().path();
const target = `${OUT}/seg_telemetry.webm`;
if (fs.existsSync(target)) fs.unlinkSync(target);
fs.renameSync(vp, target);
console.log(`saved ${target}`);

// 2) Re-capture seg_order with fill() instead of pressSequentially (more reliable)
console.log('--- ORDER ---');
const octx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const op = await octx.newPage();
await op.goto(`${BASE}/order?tier=professional`, { waitUntil: 'networkidle', timeout: 60000 });
await sleep(2000);
await op.locator('input[placeholder*="Acme"]').fill('TerraCraft Coffee');
await op.locator('input[placeholder*="B2B SaaS"]').fill('Food & Beverage');
await op.locator('textarea[placeholder*="Describe"]').fill('Specialty coffee roasters with a European subscription model targeting coffee enthusiasts.');
await op.locator('input[placeholder*="Small business"]').fill('Coffee enthusiasts and specialty cafes in Europe');
await op.locator('textarea[placeholder*="Competitor One"]').fill('Blue Bottle Coffee\nTrade Coffee\nStumptown Coffee');
await op.locator('input[placeholder*="you@company.com"]').fill('orders@terracraft.coffee');
await sleep(1500);
await op.locator('button[type="submit"]').click();
await sleep(3000);
await octx.close();
const ovp = await op.video().path();
const otarget = `${OUT}/seg_order.webm`;
if (fs.existsSync(otarget)) fs.unlinkSync(otarget);
fs.renameSync(ovp, otarget);
console.log(`saved ${otarget}`);

await browser.close();
console.log('RECAPTURE COMPLETE');
