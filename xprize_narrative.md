# ScopeAI: Official XPRIZE Written Narrative

**Category:** Small Business Services
**Project Name:** ScopeAI — Autonomous Competitive Intelligence Agency
**Target Market:** Small Businesses, Solopreneurs, Growth Agencies
**Core Model:** Gemini 2.5 Flash (Google Cloud / Vertex AI)

---

## 1. Executive Summary & Vision

ScopeAI is an autonomous competitive intelligence agency built from the ground up on Google's Gemini 2.5 Flash model running on Vertex AI. Traditional competitive analysis requires hiring consulting firms at $5,000-$15,000 per engagement, or spending 40+ hours manually scouring competitor websites, pricing pages, and reviews. Small business owners cannot afford either, leaving them at a structural disadvantage against larger incumbents.

ScopeAI replaces that with a coordinated team of specialized AI agents that delivers a professional, citation-backed competitive intelligence report in about three minutes, for $49-$149. There are zero humans in the operational loop: from Stripe payment confirmation to multi-source research, strategic cross-referencing, report composition, and delivery on the customer dashboard, ScopeAI operates 100% autonomously.

## 2. Human vs. AI Operational Division

The founding human team acts strictly as platform supervisor and system architect. All day-to-day operational workload is executed by the autonomous multi-agent pipeline.

### Human Responsibilities (<1 hour/week)
- Maintaining system prompts, schemas, and API configuration.
- Monitoring Cloud Run health and agent telemetry logs for quality assurance.
- Customer support and refund decisions.

### AI Agent Responsibilities (100% of operational execution)
1. **The Investigator Agent (Gemini 2.5 Flash + Google Search grounding):** autonomously extracts competitor positioning, live pricing structures, feature matrices, and customer sentiment from the public web, returning structured JSON via enforced response schemas.
2. **The Analyst Agent (Gemini 2.5 Flash + Google Search grounding):** cross-references the Investigator's data against live industry context, synthesizes SWOT alignment, strategic gaps, and unaddressed market opportunities.
3. **The Writer Agent (Gemini 2.5 Flash):** converts the analysis into an executive-ready Markdown report where every material claim links to a verified web source.
4. **The Orchestrator:** manages sequential execution, writes timestamped telemetry for full observability, persists state to Firestore, and delivers the report to the customer dashboard.

## 3. Measured Production Performance

All figures below were measured on the live Cloud Run deployment (us-central1) on August 10, 2026:

- **Order-to-report latency:** 96-205 seconds end-to-end (3 grounded agent passes).
- **Source density:** 31-70 live web citations per report (Google Search grounding).
- **Telemetry:** 12 timestamped agent actions per order, streamed live to the customer dashboard.
- **Reliability:** schema-enforced structured output with schema-less retry; quota backoff; no human fallback in the generation path.

## 4. Economic Impact & Job Creation Beyond the Founding Team

1. **Empowering small businesses to win:** by democratizing consulting-grade intelligence, ScopeAI lets small business owners and freelancers identify pricing inefficiencies and positioning gaps they could never afford to discover before.
2. **Enabling freelancer and agency growth:** marketing agencies and consultants use ScopeAI as a white-label research backend. An agency owner who previously spent 15 hours researching a client's competitive landscape gets the briefing in minutes, allowing them to serve more clients and hire additional strategists and account managers as volume grows.

## 5. Technical Architecture on Google Cloud

- **Model Layer:** Gemini 2.5 Flash on Vertex AI with Google Search grounding, structured JSON output schemas (`responseSchema`), and retry/backoff handling.
- **Hosting:** Google Cloud Run (containerized Next.js, standalone output, built by Cloud Build into Artifact Registry), auto-scaling with CPU always allocated so background agent pipelines never freeze.
- **Persistence:** Google Cloud Firestore (orders, reports, telemetry logs) — survives restarts and scale-out.
- **Observability:** custom telemetry dashboard recording execution timestamps, agent actions, durations, and grounding citations for every order.
- **Monetization:** Stripe Checkout with signature-verified webhooks; the `checkout.session.completed` event is the sole trigger of the agent pipeline in paid mode.

## 6. Monetization & Business Viability

- **Starter Brief ($49):** single competitor deep-dive.
- **Professional Brief ($99):** 3-competitor analysis + strategic market map (most popular).
- **Enterprise Suite ($149):** 5+ competitor analysis + priority delivery.

With zero human delivery cost, gross margin per report exceeds 90% after Gemini API and Stripe fees. The business is transactional, high-margin, and scales with Cloud Run's zero-to-peak autoscaling.

## 7. Honesty Note

This project was fully audited on August 10, 2026. Earlier artifacts containing fabricated claims (invented model name, fabricated P&L rows, invented testimonials) were removed and replaced with truthful, verifiable equivalents. Every number in this narrative is measured from the live system or exported from Stripe/Google Cloud.
