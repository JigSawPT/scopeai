---
workflow: general-video
flow: automation
storyboard: no
message: "ScopeAI delivers real, sourced competitive intelligence end-to-end with zero humans — paid via Stripe, executed by Gemini 2.5 Flash agents on Google Cloud"
destination: competition-submission
aspect: 1920x1080
language: en
length: 148s
angle: live-product-proof
---

## Intent

XPRIZE 3-minute demonstration video (final: 2:28). The viewer is a competition
judge. The video must prove live autonomous execution, not describe it: real
Playwright-captured footage of the production site running the 3-agent pipeline
with streaming telemetry, real Stripe checkout, and a finished cited report.
Motion graphics frame the footage (intro, lower-thirds, proof stats, outro).
Tone: confident, factual, no hype claims that the footage does not back.

## Assets

- assets/seg_landing.mp4 — production landing page scroll (0-8s of capture)
- assets/seg_demo.mp4 — judge sandbox preset selection + pipeline launch
- assets/seg_telemetry.mp4 — live agent telemetry, 3.2x timelapse (65s)
- assets/seg_report.mp4 — finished report scroll, 1.75x (12s)
- assets/seg_order.mp4 — order form filled and submitted
- assets/seg_stripe.mp4 — live Stripe Checkout page
- .media/audio/voice/voice_001.wav … voice_010.wav — Kokoro EN narration, 10 lines

## Customizations

- Lower-third agent callouts synced to narration (INVESTIGATOR / ANALYST / WRITER)
- Proof-stat card with real measured numbers (pipeline duration, source counts, pricing)

## Notes

- Footage is a genuine headless-browser capture of
  https://scopeai-746706977308.us-central1.run.app on 2026-08-17 (no simulation).
- Model name must read "Gemini 2.5 Flash" everywhere (never the retired
  invented name).
- No BGM chosen; narration-only audio identity (deliberate, factual tone).
