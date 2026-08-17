# ScopeAI — XPRIZE Build with Gemini Submission

## Devpost Fields (copy-paste ready)

**Project Name:** ScopeAI

**Elevator Pitch (140 chars):**
Autonomous competitive intelligence for small businesses — real-time web research by AI agents, delivered in minutes, $49-$149.

**Full Description:**
ScopeAI is an autonomous competitive intelligence agency powered entirely by Google's Gemini 2.5 Flash on Vertex AI. No humans touch the pipeline.

The customer fills out a brief about their business and competitors, pays via Stripe Checkout, and three specialized AI agents take over:

1. INVESTIGATOR — queries the live web via Google Search grounding to extract real competitor pricing, features, and review sentiment
2. ANALYST — cross-references market positioning and synthesizes strategic gaps and opportunities  
3. WRITER — drafts an executive-ready report where every claim links to a verified source

The entire pipeline runs in under 3 minutes. Every agent action is logged with timestamps and streamed live to a telemetry dashboard the customer watches in real time.

**Technical stack:** Next.js 16 on Google Cloud Run, Gemini 2.5 Flash on Vertex AI with Google Search grounding and structured JSON output (responseSchema), Google Cloud Firestore for persistence, Stripe for payments with signed webhook verification.

**What makes it real:** This is not a demo. It's a live production system processing actual payments. The video shows a genuine Playwright capture of the production site, not simulated footage.

**Category:** Small Business Services

**Built With:**
- Google Gemini 2.5 Flash (Vertex AI)
- Google Cloud Run
- Google Cloud Firestore
- Google Cloud Build + Artifact Registry
- Stripe Checkout + Webhooks
- Next.js 16 + TypeScript
- Playwright (for demo recording)

**Try it:** https://scopeai-746706977308.us-central1.run.app/demo

**Video:** https://scopeai-video-746706977308.us-central1.run.app (self-hosted MP4 with video player, no login required). Source MP4: `videos/scopeai-xprize-demo/renders/scopeai-xprize-demo_2026-08-17_09-51-28.mp4`.

**GitHub:** https://github.com/JigSawPT/scopeai

---

## Submission Checklist (Devpost)

- [ ] Video uploaded to YouTube/Vimeo (public) and link pasted above
- [ ] GitHub repo shared: `testing@devpost.com` + `judging@hacker.fund` (invitations sent or repo is public)
- [ ] Written narrative: `xprize_narrative.md` (already in repo)
- [ ] Financial evidence: Stripe export + `xprize_pnl_template.csv` (already in repo)
- [ ] Google Cloud billing PDF: export from Cloud Console → Billing → Documents
- [ ] Live demo URL: https://scopeai-746706977308.us-central1.run.app/demo

## Owner Steps (3 minutes total)

1. Upload video: open YouTube Studio → Create → Upload → select `videos\scopeai-xprize-demo\renders\scopeai-xprize-demo_2026-08-17_09-51-28.mp4` → title "ScopeAI — Autonomous Competitive Intelligence (XPRIZE)" → Public → Publish
2. Download GCP billing report PDF (Ctrl+P -> Save as PDF): https://console.cloud.google.com/billing/010CD1-58E5B1-15E14C/reports?project=digital-proton-422716-p4
3. Submit on Devpost: paste the fields above + video link + demo URL
