import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://scopeai-746706977308.us-central1.run.app';
const OUT = './video/footage';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--force-color-profile=srgb'] });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
page.setDefaultTimeout(60000);

console.log('[1/4] Landing page...');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
for (let i = 0; i < 5; i++) {
  await page.mouse.wheel(0, 550);
  await page.waitForTimeout(800);
}
await page.waitForTimeout(1000);

console.log('[2/4] Demo sandbox + live pipeline...');
await page.goto(BASE + '/demo', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.click('button:has-text("Artisanal Specialty Coffee Export")');
await page.waitForTimeout(1500);
await page.click('button:has-text("Execute Live Gemini Agent Pipeline")');
await page.waitForURL('**/report/**', { timeout: 90000 });
console.log('  -> on report page, watching live telemetry...');
await page.waitForSelector('text=Executive Summary', { timeout: 480000 });
await page.waitForTimeout(5000);

console.log('[3/4] Scrolling final report...');
await page.mouse.wheel(0, -99999);
await page.waitForTimeout(1000);
for (let i = 0; i < 12; i++) {
  await page.mouse.wheel(0, 620);
  await page.waitForTimeout(700);
}
await page.waitForTimeout(1500);

console.log('[4/4] Order form -> Stripe Checkout...');
await page.goto(BASE + '/order?tier=professional', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.fill('input[placeholder*="Acme"]', 'Lisbon Roasters');
await page.fill('input[placeholder*="B2B SaaS"]', 'Specialty Coffee');
await page.fill('textarea[placeholder*="Describe your product"]', 'Direct-trade specialty coffee roaster based in Lisbon, selling single-origin beans and subscriptions across Europe.');
await page.fill('input[placeholder*="Small business owners"]', 'European coffee enthusiasts and specialty cafes');
await page.fill('textarea[placeholder*="Competitor One"]', 'Blue Bottle Coffee\nTrade Coffee\nStumptown Coffee');
await page.fill('input[placeholder*="you@company.com"]', 'customer@lisbonroasters.pt');
await page.waitForTimeout(1500);
await page.click('button[type="submit"]');
await page.waitForURL('**/checkout.stripe.com/**', { timeout: 90000 });
console.log('  -> Stripe checkout reached, holding...');
await page.waitForTimeout(10000);

await ctx.close();
await browser.close();
console.log('DONE. Footage in', OUT);
