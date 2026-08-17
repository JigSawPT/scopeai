import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const VOICE = 'en-US-GuyNeural';
const OUTDIR = 'videos/scopeai-xprize-demo/.media/audio/voice';

const lines = [
  { id: 'voice_001', text: 'Small businesses lose to giant incumbents every single day, because real competitive intelligence costs ten thousand dollars. ScopeAI changes that.' },
  { id: 'voice_002', text: 'ScopeAI is a competitive intelligence agency, operated one hundred percent by autonomous AI agents on Google Cloud.' },
  { id: 'voice_003', text: 'The customer submits a brief and pays with Stripe. From that moment, zero human hands touch the order.' },
  { id: 'voice_004', text: 'Watch the Investigator agent query Gemini 2.5 Flash with live Google Search grounding, extracting real pricing, features, and review sentiment from the web.' },
  { id: 'voice_005', text: 'The Analyst agent cross-references market positioning and synthesizes strategic gaps and opportunities.' },
  { id: 'voice_006', text: 'The Writer agent drafts a professional report. Every claim is linked to a verified source.' },
  { id: 'voice_007', text: 'The deliverable streams live to the customer dashboard: a cited, ready-to-use intelligence report.' },
  { id: 'voice_008', text: 'Briefs start at forty nine dollars. The moment checkout completes, the agent pipeline takes over.' },
  { id: 'voice_009', text: 'Three specialized Gemini agents. Live web grounding. Complete telemetry. No humans in the loop.' },
  { id: 'voice_010', text: 'ScopeAI. Stop guessing. Start knowing.' },
];

for (const line of lines) {
  const outPath = path.join(OUTDIR, `${line.id}.wav`);
  const tmpMp3 = path.join(OUTDIR, `${line.id}_tmp.mp3`);
  
  // Generate with edge-tts (outputs mp3)
  const cmd = `edge-tts --voice "${VOICE}" --text "${line.text.replace(/"/g, '\\"')}" --write-media "${tmpMp3}"`;
  console.log(`generating ${line.id}...`);
  execSync(cmd, { stdio: 'pipe' });
  
  // Convert mp3 to wav (16-bit PCM, mono, 24kHz — matching original format)
  execSync(`ffmpeg -y -i "${tmpMp3}" -acodec pcm_s16le -ar 24000 -ac 1 "${outPath}"`, { stdio: 'pipe' });
  
  // Clean up tmp mp3
  fs.unlinkSync(tmpMp3);
  
  const dur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`).toString().trim();
  console.log(`  ${line.id}: ${dur}s`);
}

console.log('ALL VOICES GENERATED');
