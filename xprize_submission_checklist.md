# ScopeAI — XPRIZE Final Submission Checklist (HONEST STATUS)

**Competition:** Build with Gemini XPRIZE
**Deadline:** August 17, 2026 at 1:00 PM PDT
**Target Category:** Small Business Services

> **Reset on 2026-08-10 after a full project audit.** The previous version of this
> checklist marked items COMPLETE without evidence (video "done" with only a script
> file, financial evidence based on a CSV with fabricated orders, docker build claimed
> to pass despite a broken Dockerfile, GitHub repo listed without any remote).
> Rule going forward: **nothing is marked COMPLETE without a verifiable artifact.**

---

## Final Deliverables Status

| # | Requirement | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Code Repository shared with judges | IN PROGRESS | Local git repo exists; GitHub remote creation pending |
| 2 | 3-Minute Video | NOT STARTED | Only the script exists: `xprize_demo_video_script.md` |
| 3 | Written Narrative | DRAFT | `xprize_narrative.md` — must be updated with real model name and real metrics |
| 4 | Financial Evidence | NOT STARTED | Requires real Stripe transactions. Previous CSV contained fabricated orders and was wiped on 2026-08-10 |
| 5 | Google Cloud Bills | NOT STARTED | Export from Cloud Billing once production deployment is running |
| 6 | Product & Telemetry Evidence | PARTIAL | Telemetry dashboard functional; requires genuine Gemini execution (pipeline was running on offline fallback templates) |
| 7 | Customer Evidence | NOT STARTED | Requires real paying customers |

---

## Technical Architecture Checklist

- [ ] **Google Cloud Usage:** Cloud Run deployment pending — Docker build currently broken (missing `output: 'standalone'` in `next.config.ts`); fix in progress
- [ ] **Gemini API Usage:** Vertex AI API was not enabled on project `digital-proton-422716-p4`; all agent calls were silently falling back to hardcoded templates; fix in progress
- [x] **AI-Native Operations:** 3-agent architecture implemented and telemetry-instrumented (`INVESTIGATOR`, `ANALYST`, `WRITER`)
- [ ] **Monetization Engine:** Stripe keys not configured; checkout currently runs in sandbox mode only
- [x] **Judge Sandbox Mode:** `/demo` runs end-to-end (with fallback content until Gemini is restored)

---

## Final Pre-Submission Validation Commands (must all pass before submitting)

1. **TypeScript:** `npx tsc --noEmit` → 0 errors (`ignoreBuildErrors` removed from `next.config.ts`)
2. **Lint:** `npm run lint` → clean
3. **Container build:** `docker build` / Cloud Build → PASS
4. **Production E2E:** order → payment → grounded report with real web citations on the live Cloud Run URL
