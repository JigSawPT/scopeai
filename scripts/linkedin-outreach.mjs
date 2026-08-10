import { chromium } from 'playwright';
import fs from 'fs';

const MSGS_FILE = './outreach_messages.md';
const TRACKER_FILE = './outreach_tracker.csv';
const SESSION_DIR = 'C:\\Users\\jcoma\\AppData\\Local\\Temp\\playwright-linkedin-session';

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

async function main() {
  const messages = parseMessages(fs.readFileSync(MSGS_FILE, 'utf8'));
  console.log(`[outreach] ${messages.length} mensagens preparadas`);

  // Clean session
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }

  console.log('[outreach] A abrir browser...');
  const browser = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false,
    viewport: { width: 1400, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
    ],
  });

  const page = browser.pages()[0] || await browser.newPage();

  // Navigate to LinkedIn login
  console.log('[outreach] Abrindo LinkedIn...');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // Poll for login (every 5 seconds, up to 15 minutes)
  console.log('');
  console.log('================================================================');
  console.log('  O BROWSER ABRIU COM O LINKEDIN LOGIN');
  console.log('  Faz login agora — o script espera automaticamente.');
  console.log('  A janela pode estar por tras — procura o icon na taskbar.');
  console.log('================================================================');
  console.log('');

  let loggedIn = false;
  for (let i = 0; i < 180; i++) { // 180 × 5s = 15 min
    await sleep(5000);
    try {
      const url = page.url();
      if (url.includes('/feed') && !url.includes('/login') && !url.includes('/authwall')) {
        loggedIn = true;
        break;
      }
      // Also check for search bar (another login indicator)
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        loggedIn = true;
        break;
      }
    } catch {}
    if (i % 12 === 0 && i > 0) {
      console.log(`[outreach] Ainda a espera do login... (${Math.round(i * 5 / 60)} min)`);
    }
  }

  if (!loggedIn) {
    throw new Error('Login nao detetado apos 15 minutos');
  }

  console.log('[outreach] Login detetado! A comecar outreach...');
  await sleep(3000);

  let sent = 0, failed = 0;
  for (const msg of messages) {
    console.log(`\n[outreach] ${msg.index}/${messages.length}: ${msg.name}`);
    try {
      // Search for person
      await page.goto('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(msg.name), {
        waitUntil: 'domcontentloaded', timeout: 30000
      });
      await sleep(3000);

      // Click first result
      const firstResult = await page.$('a[href*="/in/"]');
      if (!firstResult) throw new Error('Nenhum resultado');
      await firstResult.click();
      await sleep(3000);

      // Click Message
      let msgClicked = false;
      const directBtn = await page.$('button:has-text("Message")');
      if (directBtn) { await directBtn.click(); msgClicked = true; await sleep(2500); }
      if (!msgClicked) {
        const moreBtn = await page.$('button:has-text("More")');
        if (moreBtn) {
          await moreBtn.click(); await sleep(1500);
          const item = await page.$('div[role="button"]:has-text("Message"), a:has-text("Message")');
          if (item) { await item.click(); msgClicked = true; await sleep(2500); }
        }
      }
      if (!msgClicked) throw new Error('Botao Message nao encontrado');

      // Find editor
      const editor = await page.waitForSelector(
        'div[role="textbox"][contenteditable="true"]',
        { timeout: 8000 }
      ).catch(() => null);
      if (!editor) throw new Error('Editor nao encontrado');

      await editor.click();
      await sleep(400);

      // Type message
      for (const char of msg.message) {
        await page.keyboard.type(char, { delay: 8 + Math.random() * 18 });
      }
      await sleep(600);

      // Send
      const sendBtn = await page.$('button:has-text("Send"), button[type="submit"]');
      if (!sendBtn) throw new Error('Send nao encontrado');
      await sendBtn.click();
      await sleep(2000);

      console.log(`  ✓ ENVIADA para ${msg.name}`);
      updateTracker(msg.name, 'Sent');
      sent++;

      const delay = 20000 + Math.random() * 20000;
      console.log(`  Aguardando ${Math.round(delay/1000)}s...`);
      await sleep(delay);
    } catch (err) {
      console.log(`  ✗ FALHOU: ${err.message}`);
      updateTracker(msg.name, `Failed: ${err.message.slice(0,40)}`);
      failed++;
      await sleep(3000);
    }
  }

  console.log(`\n[outreach] COMPLETO: ${sent} enviadas, ${failed} falhadas de ${messages.length}`);
  await sleep(10000);
  await browser.close();
}

main().catch(err => { console.error('[outreach] FATAL:', err.message); process.exit(1); });
