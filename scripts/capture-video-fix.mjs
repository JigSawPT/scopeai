import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://scopeai-746706977308.us-central1.run.app';
const OUT = 'video/capture-new';
const DONE_ORDER = '0633c838-1959-441c-b731-bd2ca5807015';
const DONE_TOKEN = 'f9cb47cc-e093-4a7e-ba26-c00348080346';
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function newContext(name, record = true) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ...(record ? { recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } } : {}),
  });
  const page = await ctx.newPage();
  page._segName = name;
  page._record = record;
  return { ctx, page };
}

async function closeSeg(ctx, page) {
  await ctx.close();
  if (!page._record) return;
  const videoPath = await page.video().path();
  const target = `${OUT}/${page._segName}.webm`;
  if (fs.existsSync(target)) fs.unlinkSync(target);
  fs.renameSync(videoPath, target);
  console.log(`saved ${target}`);
}

async function smoothScroll(page, from, to, ms) {
  const steps = Math.max(10, Math.floor(ms / 100));
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(v => window.scrollTo(0, v), from + (to - from) * (i / steps));
    await sleep(ms / steps);
  }
}

// 1) seg_report — scroll do relatório JÁ concluído (com token)
{
  const { ctx, page } = await newContext('seg_report');
  await page.goto(`${BASE}/report/${DONE_ORDER}?access=${DONE_TOKEN}`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(3000);
  await smoothScroll(page, 0, 2000, 8000);
  await smoothScroll(page, 2000, 4000, 7000);
  await sleep(2500);
  await closeSeg(ctx, page);
}

// 2) seg_order — preenchimento mais lento, ~11s (sem esperar navegação)
{
  const { ctx, page } = await newContext('seg_order');
  await page.goto(`${BASE}/order?tier=professional`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2000);
  await page.locator('input[placeholder*="Acme"]').pressSequentially('TerraCraft Coffee', { delay: 60 });
  await page.locator('input[placeholder*="B2B SaaS"]').pressSequentially('Food & Beverage', { delay: 40 });
  await page.locator('textarea[placeholder*="Describe"]').pressSequentially('Specialty coffee roasters with a European subscription model.', { delay: 20 });
  await page.locator('input[placeholder*="Small business"]').pressSequentially('Coffee enthusiasts in Europe', { delay: 25 });
  await page.locator('textarea[placeholder*="Competitor One"]').pressSequentially('Blue Bottle Coffee\nTrade Coffee\nStumptown Coffee', { delay: 20 });
  await page.locator('input[placeholder*="you@company.com"]').pressSequentially('orders@terracraft.coffee', { delay: 25 });
  await sleep(800);
  await page.locator('button[type="submit"]').click();
  await sleep(2500);
  await closeSeg(ctx, page);
}

// 3) seg_telemetry — novo run live com token intercetado
{
  // trigger (sem gravar)
  const trig = await newContext('trig', false);
  await trig.page.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2000);
  await trig.page.locator('text=Artisanal Specialty Coffee').first().click();
  await sleep(800);

  let resp = null;
  for (let attempt = 1; attempt <= 3 && !resp; attempt++) {
    const respPromise = trig.page.waitForResponse(r => r.url().includes('/api/analyze'), { timeout: 30000 });
    await trig.page.locator('text=Run Live Analysis').click();
    const r = await respPromise.catch(() => null);
    if (r && r.status() === 200) { resp = r; break; }
    const err = r ? await r.json().catch(() => ({})) : {};
    console.log(`attempt ${attempt}: status=${r ? r.status() : 'none'} ${err.error || ''}`);
    if (r && r.status() === 429) {
      const m = (err.error || '').match(/(\d+) minutes/);
      const waitMin = m ? parseInt(m[1]) : 5;
      console.log(`cooldown — waiting ${waitMin + 1} min...`);
      await sleep((waitMin + 1) * 60000);
    } else {
      await sleep(5000);
    }
  }
  if (!resp) throw new Error('Não consegui lançar o pipeline (cooldown?)');
  const data = await resp.json();
  const reportUrl = `${BASE}/report/${data.order_id}?access=${data.access_token}`;
  console.log('pipeline lançado:', data.order_id);
  await trig.ctx.close();

  // telemetria (a gravar)
  const { ctx, page } = await newContext('seg_telemetry');
  await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const start = Date.now();
  let done = false;
  while (Date.now() - start < 340000) {
    const completed = await page.evaluate(() => document.body.innerText.includes('Completed')).catch(() => false);
    if (completed) { done = true; break; }
    await sleep(3000);
  }
  console.log('telemetry done:', done, 'elapsed:', Math.round((Date.now() - start) / 1000), 's');
  await sleep(4000);
  await closeSeg(ctx, page);
}

await browser.close();
console.log('FIX CAPTURE COMPLETE');
