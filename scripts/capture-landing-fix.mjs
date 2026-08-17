import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://scopeai-746706977308.us-central1.run.app';
const OUT = 'video/capture-new';
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

// Wait for page to fully render (fonts, animations, everything)
await page.waitForFunction(() => {
  const h1 = document.querySelector('h1');
  if (!h1) return false;
  const rect = h1.getBoundingClientRect();
  return rect.height > 0 && h1.innerText.length > 5;
}, { timeout: 15000 });
await sleep(4000);

// Verify content is visible before scrolling
const hasContent = await page.evaluate(() => document.body.innerText.length > 100);
console.log('content visible:', hasContent, 'body length:', await page.evaluate(() => document.body.innerText.length));

async function smoothScroll(from, to, ms) {
  const steps = Math.max(10, Math.floor(ms / 80));
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(v => window.scrollTo(0, v), from + (to - from) * (i / steps));
    await sleep(ms / steps);
  }
}

await smoothScroll(0, 1200, 3000);
await smoothScroll(1200, 2800, 3500);
await sleep(1500);

await ctx.close();
const vp = await page.video().path();
const target = `${OUT}/seg_landing.webm`;
if (fs.existsSync(target)) fs.unlinkSync(target);
fs.renameSync(vp, target);
console.log('saved seg_landing.webm');
await browser.close();
