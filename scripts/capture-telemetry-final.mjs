import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://scopeai-746706977308.us-central1.run.app';
const OUT = 'video/capture-new';
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

// 1) trigger demo (sem gravar), com retry de cooldown
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
if (!data) throw new Error('Não consegui lançar o pipeline');
const reportUrl = `${BASE}/report/${data.order_id}?access=${data.access_token}`;
console.log('pipeline lançado:', data.order_id);
await trig.close();

// 2) gravar telemetria até o relatório COMPLETO aparecer
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

const start = Date.now();
let done = false;
while (Date.now() - start < 400000) {
  const state = await page.evaluate(() => ({
    complete: document.body.innerText.includes('Complete Generated Report'),
    logs: (document.body.innerText.match(/(\d+) events logged/) || [])[1] || '0',
  })).catch(() => ({ complete: false, logs: '0' }));
  if (state.complete) { done = true; break; }
  await sleep(3000);
}
console.log('telemetry done:', done, 'elapsed:', Math.round((Date.now() - start) / 1000), 's');
await sleep(5000);
await ctx.close();

const videoPath = await page.video().path();
const target = `${OUT}/seg_telemetry.webm`;
if (fs.existsSync(target)) fs.unlinkSync(target);
fs.renameSync(videoPath, target);
console.log(`saved ${target}`);

await browser.close();
console.log('TELEMETRY CAPTURE COMPLETE');
