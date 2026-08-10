# ScopeAI — XPRIZE Final Submission Checklist (HONEST STATUS)

**Competition:** Build with Gemini XPRIZE
**Deadline:** August 17, 2026 at 1:00 PM PDT
**Target Category:** Small Business Services

> **Reset on 2026-08-10 after a full project audit.** The previous version of this
> checklist marked items COMPLETE without evidence (video "done" with only a script
> file, financial evidence based on a CSV with fabricated orders, docker build claimed
> to pass despite a broken Dockerfile, GitHub repo listed without any remote).
> Rule going forward: **nothing is marked COMPLETE without a verifiable artifact.**

**Last verified:** 2026-08-10 ~04:10 UTC

---

## Final Deliverables Status

| # | Requirement | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Code Repository shared with judges | PARTIAL | Public repo live: https://github.com/JigSawPT/scopeai — still must be shared with `testing@devpost.com` & `judging@hacker.fund` at submission time |
| 2 | 3-Minute Video | NOT STARTED | Only the script exists: `xprize_demo_video_script.md`. Must be recorded against the live production deployment |
| 3 | Written Narrative | DRAFT | `xprize_narrative.md` updated with real model (Gemini 2.5 Flash / Vertex AI) and real stack; final metrics pending real revenue |
| 4 | Financial Evidence | NOT STARTED | Requires real Stripe transactions. Previous CSV contained fabricated orders and was wiped on 2026-08-10 |
| 5 | Google Cloud Bills | NOT STARTED | Export from Cloud Billing after submission-period usage |
| 6 | Product & Telemetry Evidence | VERIFIED LIVE | Production E2E on 2026-08-10: order → grounded pipeline → report with 41 real web sources in 205s (HTTP 200), persisted in Firestore |
| 7 | Customer Evidence | NOT STARTED | Requires real paying customers |

---

## Technical Architecture Checklist

- [x] **Google Cloud Usage:** Live on Cloud Run — https://scopeai-746706977308.us-central1.run.app (image built via Cloud Build, Artifact Registry `us-central1`)
- [x] **Gemini API Usage:** `gemini-2.5-flash` on Vertex AI (`us-central1`) with Google Search grounding + `responseSchema` structured output; verified E2E in production 2026-08-10
- [x] **AI-Native Operations:** 3-agent pipeline (`INVESTIGATOR`, `ANALYST`, `WRITER`) with timestamped telemetry per order
- [ ] **Monetization Engine:** Stripe code complete (Checkout + signature-verified webhook); **keys not yet configured** — sandbox mode active
- [x] **Judge Sandbox Mode:** `/demo` runs the real pipeline on 3 preset scenarios
- [x] **Persistence:** Firestore (`(default)`, us-central1) stores orders, reports, logs; survives Cloud Run restarts

---

## Final Pre-Submission Validation Commands (must all pass before submitting)

1. **TypeScript:** `npx tsc --noEmit` → PASS (0 errors, 2026-08-10)
2. **Lint:** `npm run lint` → PASS (clean, 2026-08-10)
3. **Container build:** Cloud Build → PASS (2m39s, 2026-08-10)
4. **Production E2E:** PASS — grounded report with real citations on the live Cloud Run URL (2026-08-10)
5. **Stripe live transaction:** PENDING — requires configured keys + real customer order
