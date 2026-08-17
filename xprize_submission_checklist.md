# ScopeAI — XPRIZE Final Submission Checklist (HONEST STATUS)

**Competition:** Build with Gemini XPRIZE
**Deadline:** August 17, 2026 at 1:00 PM PDT
**Target Category:** Small Business Services

> Rule: **nothing is marked COMPLETE without a verifiable artifact.**

**Last verified:** 2026-08-11 ~15:00 UTC

---

## Final Deliverables Status

| # | Requirement | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Code Repository shared with judges | COMPLETE | Repo is PUBLIC: https://github.com/JigSawPT/scopeai (verified via GitHub API 2026-08-11). No invitation needed. |
| 2 | 3-Minute Video | COMPLETE | Self-hosted: https://scopeai-video-746706977308.us-central1.run.app (2m28s, 1080p, fresh production footage of current site + narration). Source MP4: `videos/scopeai-xprize-demo/renders/scopeai-xprize-demo_2026-08-17_06-33-28.mp4`. |
| 3 | Written Narrative | COMPLETE | `xprize_narrative.md` — 500-1000 words, all figures measured from live system 2026-08-10 |
| 4 | Financial Evidence | PARTIAL | `xprize_pnl_template.csv` with real Stripe data (refunded verification order + real fee) + GCP costs to date ($2.80 lifetime). Append real customer orders as they occur; attach Stripe Payments export at submission |
| 5 | Google Cloud Bills | PENDING | Owner to export invoice PDF from Cloud Console Billing (one click); amount then filled in P&L |
| 6 | Product & Telemetry Evidence | VERIFIED LIVE | Production E2E re-verified 2026-08-11 (revision 00011): legacy sample reports live (HubSpot 63/Shopify 49/Notion 44 sources), new orders token-protected (401/404 without token), demo cooldown 15 min, homepage shows sample reports |
| 7 | Customer Evidence | PENDING | Requires real arm's-length orders — outreach kit: `customer_outreach.md` + `linkedin_followups.md` |

---

## Outreach Log (verified 2026-08-11)

- 9 direct messages sent and confirmed in inbox: Katelyn Bourgoin, Andrea Nwachukwu (Kalungi), Peep Laja, James Hawkins (PostHog), Zeh Fernandes (Resend), Chris Frantz (Loops), Raquel Reis (Octoboard), Steven Tey (Dub), Jen Spencer (Booth).
- 7 connection requests pending (batch 1, Aug 10).
- 0 replies to date. No fabricated testimonials — honest status.

---

## Technical Architecture Checklist

- [x] **Google Cloud Usage:** Live on Cloud Run — https://scopeai-746706977308.us-central1.run.app (Cloud Build + Artifact Registry, us-central1)
- [x] **Gemini API Usage:** `gemini-2.5-flash` on Vertex AI with Google Search grounding + `responseSchema`; verified E2E in production
- [x] **AI-Native Operations:** 3-agent pipeline with timestamped telemetry per order
- [x] **Monetization Engine:** Stripe LIVE — checkout session, signature-verified webhook, full paid cycle verified 2026-08-10
- [x] **Judge Sandbox Mode:** `/demo` streams live telemetry instantly (background pipeline)
- [x] **Persistence:** Firestore (`(default)`, us-central1)

---

## Final Pre-Submission Validation Commands

1. **TypeScript:** `npx tsc --noEmit` → PASS (0 errors)
2. **Lint:** `npm run lint` → PASS (clean)
3. **Container build:** Cloud Build → PASS (2m45s)
4. **Production E2E:** PASS — live payment → report with 40+ real citations
5. **Video checks:** `npx hyperframes check` → PASS (15/15 contrast)

---

## Owner action list (only a human can do these)

1. Upload the rendered video to YouTube (Public) — metadata copy-paste ready in `youtube_upload_ready.md`. File: `videos\scopeai-xprize-demo\renders\scopeai-xprize-demo_2026-08-10_12-03-10.mp4`. Video is already publicly accessible at https://scopeai-video-746706977308.us-central1.run.app (self-hosted, no login required).
2. Export the GCP invoice PDF (Cloud Console → Billing → Documents). URL: https://console.cloud.google.com/billing/010CD1-58E5B1-15E14C/documents?project=digital-proton-422716-p4
3. Send the LinkedIn follow-ups in `linkedin_followups.md` (9 nudges, manual send, ~10 min) and collect any replies for testimonials.
4. Submit on Devpost before Aug 17 13:00 PDT using fields in `SUBMISSION.md` (repo is already public — no share invite needed).
5. Post-competition hygiene: roll Stripe keys; delete machine-level `GEMINI_API_KEY` env var (needs admin).
