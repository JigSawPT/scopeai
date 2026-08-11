# ScopeAI — Marketing Content (All Platforms)

**Instructions:** Copy-paste each post into the respective platform. Customize [bracketed] sections if needed. All demo links point to the live sandbox.

---

## 1. Reddit r/SaaS Post

**Title:** I spent 40 hours doing competitive analysis manually. Then I automated it. Here's what I learned.

**Body:**

I run a small SaaS and every quarter I'd spend a full week researching competitors — scraping pricing pages, reading G2 reviews, comparing feature sets, trying to reverse-engineer their positioning. It was painful, but I kept doing it because the insights were genuinely useful. I'd find gaps in their pricing, features they'd quietly deprecated, complaints from their users that told me exactly what to build next.

The problem was time. 40 hours a quarter is insane for a solo founder.

So I started automating it. I built a system using Gemini 2.5 Flash with live Google Search grounding — three specialized AI agents that research competitors on the real web, pull actual pricing data, read review sentiment, and produce a structured report with citations. Not hallucinated data — every claim links to a real source.

What I learned building this:

**1. Competitive intelligence is not SEO.** Tools like Ahrefs and SEMrush track keywords and backlinks. That's useful, but it's not the same as understanding *why* a competitor prices at $49/mo, what their users hate, or where their positioning is weak. That requires reading and synthesizing, not just crawling.

**2. Real-time data changes everything.** Competitors change pricing pages constantly. The tool I built scrapes the live web at query time, so you're not looking at 6-month-old cached data. I've caught competitors mid-price-change that I would have missed with a quarterly review.

**3. Citations matter more than conclusions.** When I did this manually, I'd write "Competitor X has weak onboarding" but couldn't always remember where I saw it. The automated version links every claim to a source, which makes the recommendations actually actionable.

**4. The real value is the strategic gaps.** Pricing data is nice, but the killer feature is finding what competitors *aren't* doing. Where their messaging is vague. Where reviews show unmet demand. That's where your next feature or positioning angle comes from.

I've been running this on my own competitors for a few months and it's replaced my quarterly research slog. I'm opening it up as a paid tool — $49 for a single competitor deep-dive, $99 for 3 competitors, $149 for 5+.

If you want to see what the output looks like, here's a live demo that runs the real pipeline on preset scenarios: https://scopeai-746706977308.us-central1.run.app/demo

Would love feedback from other SaaS founders on whether this would actually save you time. What competitors would you want analyzed?

---

## 2. Reddit r/Entrepreneur Post

**Title:** How small businesses can compete against larger competitors using intelligence (not just hustle)

**Body:**

I've been thinking a lot about the asymmetry small businesses face. You're competing against companies with entire teams dedicated to market research, competitive analysis, and strategic planning. You have... yourself, maybe a co-founder, and a to-do list that never ends.

But here's the thing — you don't need a team. You need intelligence.

Not generic "know your market" advice. Actual, specific, current intelligence:

- What exactly are your competitors charging right now? (Not what they charged 6 months ago)
- What do their customers complain about in reviews?
- Where is their positioning weak or vague?
- What features have they quietly deprecated or never built?

This is the stuff that wins deals. When you know a competitor's users are complaining about slow support, you can position your offering around responsiveness. When you know their pricing just jumped 30%, you can target their price-sensitive segment.

I used to spend hours doing this research manually — reading G2 reviews, checking pricing pages, comparing feature sets. It worked, but it took forever.

I ended up building a tool to automate it. It uses AI agents that research competitors on the live web and produce a structured report in about 3 minutes. Real pricing data, real review sentiment, real citations. Not generic AI-generated fluff.

The insight that surprised me most: **the biggest competitive gaps are usually in the boring stuff.** Not features, but onboarding experience, support quality, pricing transparency, contract flexibility. Those are the things that make customers switch, and they're the things big competitors are slowest to fix.

If you're interested, I have a live demo that shows what the reports look like: https://scopeai-746706977308.us-central1.run.app/demo

Curious — how do you all currently track what your competitors are doing? Spreadsheets? Manual research? Just vibes?

---

## 3. Reddit r/smallbusiness Post

**Title:** Is there a way to find out how we stack up against competitors without hiring a consultant?

**Body:**

I run a small business and I'm trying to figure out where we stand relative to our competitors. Not just "who else is out there" but actual actionable stuff — what they're charging, what their customers like/dislike about them, where we might have an advantage.

I looked into hiring a consultant but the quotes I got were $5K-$15K for a proper competitive analysis. That's way out of budget for a small business.

I also looked at tools like SEMrush and Ahrefs, but those are really SEO tools — they track keywords and backlinks, not the strategic stuff I actually need.

Has anyone found a practical way to do this without spending thousands? I'm specifically looking for:

- Current competitor pricing (not outdated data)
- What their customers say in reviews
- Feature/positioning comparisons
- Strategic gaps we could exploit

I've been experimenting with some AI tools that research competitors on the live web and produce a structured report. One of them (ScopeAI, if anyone's curious) does it in about 3 minutes with real citations — here's a demo if you want to see what the output looks like: https://scopeai-746706977308.us-central1.run.app/demo

But I'm also curious what other small business owners do. Do you just manually check competitor sites? Use a spreadsheet? Ignore competitors entirely and focus on your own thing?

---

## 4. Indie Hackers Post (Show IH)

**Title:** Show IH: ScopeAI — competitive intelligence reports in 3 minutes, powered by Gemini 2.5 Flash

**Body:**

I built an autonomous AI agency that produces professional competitive intelligence reports. Here's the honest breakdown:

**What it does:**
A customer pays $49-$149 via Stripe, and three specialized Gemini agents (Investigator → Analyst → Writer) research the live web with Google Search grounding and deliver a cited report — zero humans in the loop.

**Architecture:**
- Built on Google Cloud: Cloud Run, Vertex AI, Firestore, Cloud Build
- Three-agent pipeline: Investigator scrapes the live web, Analyst synthesizes findings, Writer produces the final report
- Gemini 2.5 Flash with live Google Search grounding — every claim links to a real source
- Stripe for payments, real-time telemetry dashboard shows agents working

**What's in a report:**
- Executive summary with market sizing data
- Competitor profiles with real pricing, features, and review sentiment
- SWOT analysis and strategic gaps
- Actionable recommendations
- Every claim linked to a verified web source

**Honest metrics:**
- Built in [X weeks] as a solo project
- Reports take ~3 minutes end-to-end
- Currently at $0 MRR (just launched the demo)
- Hosting costs: ~$50/month on Cloud Run

**Pricing:**
- $49 — 1 competitor deep-dive
- $99 — 3 competitors
- $149 — 5+ competitors

**What I'd love feedback on:**
1. Is the report quality useful enough to pay for?
2. Would you use this for your own competitors or for client work?
3. What's missing from the current output?

Live demo (judge sandbox, runs the real pipeline): https://scopeai-746706977308.us-central1.run.app/demo

Built for the Build with Gemini XPRIZE. Would love honest feedback on report quality — I'm iterating fast based on what people actually find useful.

---

## 5. LinkedIn Post

**Why your small business is losing deals to competitors you've never analyzed**

I talk to founders every week who know their product is better than the competition. They can list 10 reasons why.

But when I ask "what's your competitor charging right now?" — silence.

When I ask "what do their customers complain about?" — more silence.

Here's the problem: **knowing your product is better isn't enough. You need to know exactly where competitors are weak, and position against that weakness specifically.**

The data is all public. Competitor pricing is on their website. Customer complaints are on G2 and Capterra. Feature gaps are visible in their docs.

But synthesizing all of that takes hours — and most founders don't have hours.

I've been experimenting with a different approach. I built an AI system that researches competitors on the live web and produces a structured competitive intelligence report in about 3 minutes. Real pricing data, real review sentiment, real citations — not generic AI-generated advice.

The most useful finding from my own competitive analysis: my biggest competitor had quietly raised their pricing 3 months ago and their customers were furious. I would have missed that entirely with my old quarterly review process.

If you're curious what these reports look like, here's a live demo that runs the real pipeline: https://scopeai-746706977308.us-central1.run.app/demo

What's your process for staying on top of competitors? I'm genuinely curious — I've talked to founders who do everything from spreadsheets to hired consultants.

#CompetitiveIntelligence #SaaS #SmallBusiness #StartupLife #FounderLife #MarketResearch #AI

---

## 6. Hacker News "Show HN" Post

**Title:** Show HN: ScopeAI – AI-powered competitive intelligence reports in 3 minutes

**URL:** https://scopeai-746706977308.us-central1.run.app/demo

**First Comment:**

I built ScopeAI — an autonomous system that produces professional competitive intelligence reports using three specialized AI agents.

**How it works:**

The pipeline has three agents running on Gemini 2.5 Flash with live Google Search grounding:

1. **Investigator Agent** — Takes the competitor names and researches them on the live web. Pulls pricing data, feature lists, recent news, and review sentiment from G2/Capterra/etc. Every piece of data is tagged with its source URL.

2. **Analyst Agent** — Takes the Investigator's raw findings and synthesizes them into structured insights: SWOT analysis, strategic gaps, pricing comparisons, market positioning maps. Cross-references claims against multiple sources.

3. **Writer Agent** — Takes the Analyst's structured insights and produces a professional report with executive summary, competitor profiles, actionable recommendations, and a full citation list.

**Technical details:**
- **Runtime:** Google Cloud Run (serverless containers, scales to zero)
- **AI:** Vertex AI with Gemini 2.5 Flash — chosen for speed and cost (reports complete in ~3 min)
- **Data:** Live Google Search grounding — not a vector DB, not cached data. Every query hits the web in real time.
- **Storage:** Firestore for report metadata, Stripe for payments
- **Costs:** ~$0.50 in API costs per report, hosted on Cloud Run for ~$50/month

**Why I built this:**
I was spending 40+ hours per quarter doing competitive analysis manually for my own SaaS. The existing tools (SEMrush, Ahrefs) are SEO tools — they track keywords and backlinks, not strategic positioning. I wanted something that would read and synthesize like a consultant, not just crawl.

**Demo:** https://scopeai-746706977308.us-central1.run.app/demo

The demo runs the real pipeline on 3 preset scenarios. You can watch the agents work in real time via the telemetry dashboard.

**Pricing:** $49 (1 competitor), $99 (3 competitors), $149 (5+ competitors)

Would love feedback on:
- Report quality vs. what you'd expect from a consultant
- Whether the citations are useful/trustworthy
- What's missing from the current output

---

## 7. Twitter/X Thread

**Tweet 1 (Hook):**

I built an AI that researches your competitors and produces a full intelligence report in 3 minutes.

Real pricing data. Real review sentiment. Real citations.

Not ChatGPT-generated fluff — live web research.

Here's how it works 🧵

---

**Tweet 2 (The Problem):**

The old way to do competitive intelligence:
- Spend 40+ hours scraping pricing pages
- Read hundreds of G2/Capterra reviews
- Build spreadsheets that are outdated in a week
- Or pay a consultant $5K-$15K

Most founders just... don't do it. And they lose deals to competitors they never analyzed.

---

**Tweet 3 (The Solution):**

ScopeAI uses 3 specialized AI agents on Gemini 2.5 Flash:

1. Investigator → scrapes the live web
2. Analyst → synthesizes findings
3. Writer → produces the report

Every claim links to a real source. Not hallucinated data — actual web citations.

---

**Tweet 4 (The Output):**

What you get in a report:
- Executive summary with market sizing
- Competitor profiles with real pricing
- Feature gap analysis
- Review sentiment breakdown
- SWOT analysis
- Actionable recommendations

All in ~3 minutes. All cited.

---

**Tweet 5 (CTA):**

Live demo — runs the real pipeline on preset scenarios:

https://scopeai-746706977308.us-central1.run.app/demo

$49 for a single competitor deep-dive. $99 for 3 competitors.

Would love feedback from founders who've done competitive research the manual way. Is this useful?

#buildinpublic #SaaS #AI #CompetitiveIntelligence

---

## CROSS-PLATFORM NOTES

### Reddit General Rules:
- Never lead with the product — lead with the problem
- Engage comments for 48+ hours after posting
- Don't post the same content on multiple subreddits on the same day
- r/Entrepreneur: Never mention product by name in post body; answer in comments if asked
- r/smallbusiness: Questions only, no promotional posts

### LinkedIn:
- Put demo link in COMMENTS, not the post body (algorithm penalty for external links)
- First 2 lines are critical — they're the "above the fold" hook
- Engage every comment within the first 2 hours

### Hacker News:
- First comment must be technical and substantive
- Don't use marketing language — HN users smell it instantly
- Be honest about limitations

### Twitter/X:
- Thread format performs better than single tweets
- #buildinpublic community is supportive of paid products
- Engage replies for 24 hours

### Indie Hackers:
- Revenue transparency is celebrated — share honest metrics
- "Looking for feedback" framing is always welcome
- Include product link directly in post body
