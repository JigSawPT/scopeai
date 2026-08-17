import edge_tts
import asyncio
import subprocess
import os

VOICE = 'en-US-GuyNeural'
OUTDIR = 'videos/scopeai-xprize-demo/.media/audio/voice'

LINES = [
    ('voice_001', 'Small businesses lose to giant incumbents every single day, because real competitive intelligence costs ten thousand dollars. ScopeAI changes that.'),
    ('voice_002', 'ScopeAI is a competitive intelligence agency, operated one hundred percent by autonomous AI agents on Google Cloud.'),
    ('voice_003', 'The customer submits a brief and pays with Stripe. From that moment, zero human hands touch the order.'),
    ('voice_004', 'Watch the Investigator agent query Gemini 2.5 Flash with live Google Search grounding, extracting real pricing, features, and review sentiment from the web.'),
    ('voice_005', 'The Analyst agent cross-references market positioning and synthesizes strategic gaps and opportunities.'),
    ('voice_006', 'The Writer agent drafts a professional report. Every claim is linked to a verified source.'),
    ('voice_007', 'The deliverable streams live to the customer dashboard: a cited, ready-to-use intelligence report.'),
    ('voice_008', 'Briefs start at forty nine dollars. The moment checkout completes, the agent pipeline takes over.'),
    ('voice_009', 'Three specialized Gemini agents. Live web grounding. Complete telemetry. No humans in the loop.'),
    ('voice_010', 'ScopeAI. Stop guessing. Start knowing.'),
]

async def generate():
    for voice_id, text in LINES:
        mp3_path = os.path.join(OUTDIR, f'{voice_id}_tmp.mp3')
        wav_path = os.path.join(OUTDIR, f'{voice_id}.wav')
        
        print(f'generating {voice_id}...')
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(mp3_path)
        
        subprocess.run(['ffmpeg', '-y', '-i', mp3_path, '-acodec', 'pcm_s16le', '-ar', '24000', '-ac', '1', wav_path], capture_output=True)
        os.remove(mp3_path)
        
        result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav_path], capture_output=True, text=True)
        print(f'  {voice_id}: {result.stdout.strip()}s')
    
    print('ALL VOICES GENERATED')

asyncio.run(generate())
