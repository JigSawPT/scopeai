import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://scopeai-746706977308.us-central1.run.app';
const OUT = 'video/capture-new';
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function newContext(name) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page._segName = name;
  return { ctx, page };
}

async function closeSeg(ctx, page) {
  await ctx.close();
  const videoPath = await page.video().path();
  const target = `${OUT}/${page._segName}.webm`;
  if (fs.existsSync(target)) fs.unlinkSync(target);
  fs.renameSync(videoPath, target);
  console.log(`saved ${target}`);
}

async function smoothScroll(page, from, to, ms) {
  const steps = Math.max(10, Math.floor(ms / 100));
  for (let i = 0; i <= steps; i++) {
    const y = from + (to - from) * (i / steps);
    await page.evaluate(v => window.scrollTo(0, v), y);
    await sleep(ms / steps);
  }
}

// 1) Landing page (~11s)
{
  const { ctx, page } = await newContext('seg_landing');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2500);
  await smoothScroll(page, 0, 1500, 3500);
  await smoothScroll(page, 1500, 3000, 3500);
  await sleep(1500);
  await closeSeg(ctx, page);
}

// 2) Demo page: select preset + launch (~10s)
let reportUrl = null;
{
  const { ctx, page } = await newContext('seg_demo');
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2500);
  await page.locator('text=Artisanal Specialty Coffee').first().click();
  await sleep(1200);
  await page.locator('text=Run Live Analysis').click();
  await sleep(2500);
  reportUrl = page.url();
  if (!reportUrl.includes('/report/')) {
    await page.waitForURL('**/report/**', { timeout: 15000 });
    reportUrl = page.url();
  }
  console.log('report url:', reportUrl);
  await sleep(3500);
  await closeSeg(ctx, page);
}

// 3) Telemetry: record report page until pipeline completes (max 240s)
{
  const { ctx, page } = await newContext('seg_telemetry');
  await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const start = Date.now();
  let done = false;
  while (Date.now() - start < 240000) {
    const completed = await page.evaluate(() => document.body.innerText.includes('Completed')).catch(() => false);
    if (completed) { done = true; break; }
    await sleep(3000);
  }
  console.log('telemetry done:', done, 'elapsed:', Math.round((Date.now() - start) / 1000), 's');
  await sleep(4000);
  await closeSeg(ctx, page);
}

// 4) Report scroll (~22s realtime -> 1.75x timelapse)
{
  const { ctx, page } = await newContext('seg_report');
  await page.goto(reportUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2500);
  await smoothScroll(page, 0, 2400, 9000);
  await smoothScroll(page, 2400, 4200, 7000);
  await sleep(2000);
  await closeSeg(ctx, page);
}

// 5) Order form fill + submit (~10s)
let stripeUrl = null;
{
  const { ctx, page } = await newContext('seg_order');
  await page.goto(`${BASE}/order?tier=professional`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(1500);
  await page.fill('input[placeholder*="Acme"]', 'TerraCraft Coffee');
  await page.fill('input[placeholder*="B2B SaaS"]', 'Food & Beverage');
  await page.fill('textarea[placeholder*="Describe"]', 'Direct-to-consumer specialty coffee roasters with a subscription model for European customers.');
  await page.fill('input[placeholder*="Small business"]', 'Coffee enthusiasts and specialty cafes in Europe');
  await page.fill('textarea[placeholder*="Competitor One"]', 'Blue Bottle Coffee\nTrade Coffee\nStumptown Coffee');
  await page.fill('input[placeholder*="you@company.com"]', 'orders@terracraft.coffee');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/checkout.stripe.com/**', { timeout: 30000 }).catch(() => null);
  stripeUrl = page.url().includes('stripe.com') ? page.url() : null;
  console.log('stripe url captured:', !!stripeUrl);
  await closeSeg(ctx, page);
}

// 6) Stripe Checkout page (~12s)
if (stripeUrl) {
  const { ctx, page } = await newContext('seg_stripe');
  await page.goto(stripeUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(9000);
  await closeSeg(ctx, page);
} else {
  console.log('NO STRIPE URL — will reuse old seg_stripe.mp4');
}

await browser.close();
console.log('CAPTURE COMPLETE');
