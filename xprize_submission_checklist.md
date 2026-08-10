# ScopeAI — XPRIZE Final Submission Checklist (HONEST STATUS)

**Competition:** Build with Gemini XPRIZE
**Deadline:** August 17, 2026 at 1:00 PM PDT
**Target Category:** Small Business Services

> Rule: **nothing is marked COMPLETE without a verifiable artifact.**

**Last verified:** 2026-08-10 ~12:10 UTC

---

## Final Deliverables Status

| # | Requirement | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Code Repository shared with judges | PARTIAL | Public repo live: https://github.com/JigSawPT/scopeai — owner must share with `testing@devpost.com` & `judging@hacker.fund` at submission |
| 2 | 3-Minute Video | RENDERED — UPLOAD PENDING | `videos/scopeai-xprize-demo/renders/scopeai-xprize-demo_2026-08-10_12-03-10.mp4` (2m28s, 1080p, real production footage + narration). Owner must upload to YouTube/Vimeo (public) and paste link here |
| 3 | Written Narrative | COMPLETE | `xprize_narrative.md` — 500-1000 words, all figures measured from live system 2026-08-10 |
| 4 | Financial Evidence | PARTIAL | `xprize_pnl_template.csv` with real Stripe data (refunded verification order + real fee). Append real customer orders as they occur; attach Stripe Payments export at submission |
| 5 | Google Cloud Bills | PENDING | Owner to export invoice PDF from Cloud Console Billing (one click); amount then filled in P&L |
| 6 | Product & Telemetry Evidence | VERIFIED LIVE | Production E2E: payment → grounded pipeline → cited report; telemetry dashboard live at /report/[id] |
| 7 | Customer Evidence | PENDING | Requires real arm's-length orders — outreach kit: `customer_outreach.md` |

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

1. Upload the rendered video to YouTube/Vimeo (public, unlisted NOT allowed) and record the link.
2. Export the GCP invoice PDF (Cloud Console → Billing → Documents).
3. Send outreach (templates in `customer_outreach.md`) and collect 5-10 real orders.
4. Share the GitHub repo with `testing@devpost.com` & `judging@hacker.fund`; submit on Devpost before Aug 17 13:00 PDT.
5. Post-competition hygiene: roll Stripe keys; delete machine-level `GEMINI_API_KEY` env var (needs admin).
