import { chromium } from 'playwright';
import fs from 'fs';

const MSGS_FILE = './outreach_messages.md';
const TRACKER_FILE = './outreach_tracker.csv';
const SESSION_DIR = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session2';

function parseMessages(md) {
  const blocks = md.split(/^###\s+\d+\./m).slice(1);
  const results = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.trim().split('\n');
    const name = (lines[0] || '').replace(/\(.*?\)/g, '').replace(/\*\*/g, '').split('—')[0].trim();
    const msgStart = block.indexOf('> ');
    if (msgStart === -1) continue;
    let msgEnd = block.indexOf('\n---', msgStart);
    if (msgEnd === -1) msgEnd = block.indexOf('\n## ', msgStart);
    if (msgEnd === -1) msgEnd = block.length;
    let rawMsg = block.slice(msgStart, msgEnd).trim();
    rawMsg = rawMsg.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n').trim();
    if (rawMsg.length < 30) continue;
    results.push({ index: i + 1, name, message: rawMsg });
  }
  return results;
}

function updateTracker(name, status) {
  let csv = fs.readFileSync(TRACKER_FILE, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const updated = csv.split('\n').map(line => {
    if (line.includes(name) && (line.includes('Not sent') || line.includes('Failed'))) {
      const parts = line.split(',');
      if (parts.length >= 8) { parts[6] = status; parts[7] = today; }
      return parts.join(',');
    }
    return line;
  });
  fs.writeFileSync(TRACKER_FILE, updated.join('\n'));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function debugPage(page, label) {
  const url = page.url();
  const title = await page.title();
  console.log(`  [debug] ${label}: url=${url} title=${title}`);
  await page.screenshot({ path: `video/footage/debug_${label.replace(/\s/g,'_')}.png` });
}

async function main() {
  const messages = parseMessages(fs.readFileSync(MSGS_FILE, 'utf8'));
  console.log(`[outreach] ${messages.length} mensagens`);

  if (fs.existsSync(SESSION_DIR)) fs.rmSync(SESSION_DIR, { recursive: true, force: true });

  const browser = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    viewport: { width: 1400, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });
  const page = browser.pages()[0] || await browser.newPage();

  console.log('[outreach] Abrindo LinkedIn...');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // Poll for login
  console.log('FAZ LOGIN NO BROWSER QUE ABRIU (procura na taskbar)');
  let loggedIn = false;
  for (let i = 0; i < 180; i++) {
    await sleep(5000);
    try {
      const url = page.url();
      if (url.includes('/feed') && !url.includes('/login')) { loggedIn = true; break; }
      const search = await page.$('input[placeholder*="Search"]');
      if (search) { loggedIn = true; break; }
    } catch {}
    if (i % 12 === 0 && i > 0) console.log(`[outreach] A espera do login... (${Math.round(i*5/60)} min)`);
  }
  if (!loggedIn) throw new Error('Login timeout');
  console.log('[outreach] Login OK!');
  await sleep(3000);

  // DEBUG: test with first message
  const testMsg = messages[0];
  console.log(`\n[DEBUG] Testando com: ${testMsg.name}`);

  // Search
  await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(testMsg.name), {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await sleep(4000);
  await debugPage(page, 'search_results');

  // Find profile links
  const links = await page.$$eval('a[href*="/in/"]', els => els.map(e => ({ href: e.href, text: e.textContent?.trim().slice(0, 60) })));
  console.log('  [debug] Profile links found:', links.length);
  links.slice(0, 3).forEach(l => console.log('    -', l.text, '→', l.href));

  if (links.length > 0) {
    // Click first profile link
    const firstLink = await page.$('a[href*="/in/"]');
    await firstLink.click();
    await sleep(4000);
    await debugPage(page, 'profile_page');

    // Find ALL buttons on the page
    const buttons = await page.$$eval('button', els => els.map(e => ({
      text: e.textContent?.trim().slice(0, 50),
      aria: e.getAttribute('aria-label'),
      classes: e.className?.slice(0, 80),
    })));
    console.log('  [debug] Buttons on profile:', buttons.length);
    const msgButtons = buttons.filter(b => 
      (b.text && b.text.toLowerCase().includes('message')) || 
      (b.aria && b.aria.toLowerCase().includes('message'))
    );
    console.log('  [debug] Message-like buttons:', msgButtons);

    // Also check for links with "Message"
    const msgLinks = await page.$$eval('a', els => els.filter(e => e.textContent?.toLowerCase().includes('message')).map(e => ({ href: e.href, text: e.textContent?.trim().slice(0, 50) })));
    console.log('  [debug] Message links:', msgLinks);

    // Try to find and click Message
    let found = false;
    for (const selector of [
      'button:has-text("Message")',
      'button[aria-label*="Message"]',
      'a:has-text("Message")',
      '.message-anywhere-button',
      'button:has-text("Mensagem")',  // Portuguese UI
    ]) {
      const el = await page.$(selector);
      if (el) {
        console.log(`  [debug] Found with selector: ${selector}`);
        await el.click();
        found = true;
        await sleep(3000);
        await debugPage(page, 'after_message_click');
        break;
      }
    }
    if (!found) {
      // Try "More" menu
      const moreBtn = await page.$('button:has-text("More"), button:has-text("Mais")');
      if (moreBtn) {
        console.log('  [debug] Trying More menu...');
        await moreBtn.click();
        await sleep(2000);
        await debugPage(page, 'more_menu');
        const menuItems = await page.$$eval('[role="button"], [role="menuitem"], a', els => 
          els.filter(e => e.textContent?.toLowerCase().includes('message')).map(e => ({ tag: e.tagName, text: e.textContent?.trim().slice(0, 50) }))
        );
        console.log('  [debug] Menu items with "message":', menuItems);
      }
    }
  }

  console.log('\n[DEBUG] Screenshots saved in video/footage/debug_*.png');
  console.log('[DEBUG] Abre essas imagens para ver o que o browser mostrou.');
  console.log('[DEBUG] Browser fica aberto — fecha manualmente quando terminares.');
  
  // Don't close browser — let user inspect
  // await browser.close();
}

main().catch(err => { console.error('[outreach] FATAL:', err.message); process.exit(1); });
