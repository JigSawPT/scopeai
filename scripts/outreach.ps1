# ScopeAI LinkedIn Outreach — Semi-Automated
# Run this in PowerShell: .\scripts\outreach.ps1
# It opens each LinkedIn profile, copies the message to clipboard, 
# you paste and send, then press Enter to continue.

$messages = @(
  @{ Name = "Kalungi"; Search = "Kalungi agency"; Msg = "Hi — I noticed Kalungi does positioning and GTM for B2B SaaS companies. I built ScopeAI: an AI system that produces a full competitive intelligence report (pricing, positioning, review sentiment, strategic gaps) in ~3 minutes for $99. It uses Gemini 2.5 Flash with live Google Search grounding — every claim links to a real source.

I'm looking for honest feedback from agencies that do this work. Would you try one on a client's competitors? Live demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Foundation Marketing"; Search = "Foundation Inc content marketing"; Msg = "Hi — Foundation does content strategy for tech companies, and I imagine competitive research is a big part of your process. I built ScopeAI: autonomous AI agents that research competitors on the live web and produce a cited intelligence report in ~3 minutes.

$99 for a 3-competitor analysis. Curious if this would speed up your research workflow. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Single Grain"; Search = "Single Grain digital marketing"; Msg = "Hi — I built an AI tool that does competitive intelligence reports in ~3 minutes: real pricing data, feature gaps, review sentiment, all from the live web with citations. It's $99 for 3 competitors.

I'm looking for feedback from agencies that serve SaaS clients. Would love to run one on a relevant competitor landscape. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Bay Leaf Digital"; Search = "Bay Leaf Digital B2B SaaS"; Msg = "Hi — Bay Leaf does competitive analysis for B2B SaaS companies. I built ScopeAI: autonomous AI agents that research competitors on the live web (pricing, features, reviews, strategic gaps) and produce a cited report in ~3 minutes. $99 for 3 competitors.

Would love your honest feedback — happy to run one on one of your client's competitors as a test. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Hey Digital"; Search = "Hey Digital SaaS marketing"; Msg = "Hi — Hey Digital works with SaaS companies on growth. I built a tool that might save your team hours of competitive research: ScopeAI runs autonomous AI agents that scrape the live web and produce a structured intelligence report in ~3 minutes.

$99 for 3 competitors. Curious if this would accelerate your client onboarding. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Mangools"; Search = "Mangools SEO tools"; Msg = "Hi — Mangools competes in the SEO tools space against Ahrefs, SEMrush, and Moz. I built an AI system that produces a full competitive intelligence report on your competitors in ~3 minutes: real pricing data, feature gaps, review sentiment, strategic positioning — all from the live web with citations.

$49 for a single competitor deep-dive. Want me to run one on Ahrefs or SEMrush so you can judge the quality? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Socialinsider"; Search = "Socialinsider social media analytics"; Msg = "Hi — Socialinsider competes against Sprout Social, Hootsuite, and Buffer in social media analytics. I built ScopeAI: autonomous AI agents that research your competitors on the live web and produce a cited intelligence report in ~3 minutes.

$49 for a single competitor analysis. I'd love to run one on Sprout Social or Hootsuite for you to evaluate. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "KyLeads"; Search = "KyLeads lead generation"; Msg = "Hi — KyLeads competes in the lead generation space against OptinMonster and Sumo. I built an AI system that does competitive intelligence in ~3 minutes: pricing, features, review sentiment, strategic gaps — all from the live web.

$49 for a single competitor brief. Want me to run one on OptinMonster? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Octoboard"; Search = "Octoboard dashboards"; Msg = "Hi — Octoboard competes against Databox and Geckoboard in the business dashboard space. I built ScopeAI: AI agents that research your competitors on the live web and deliver a cited competitive intelligence report in ~3 minutes.

$49 for a single competitor deep-dive. Would you try it on Databox or Geckoboard? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "WooRank"; Search = "WooRank SEO audit"; Msg = "Hi — WooRank competes in the SEO audit space against SEMrush, Ahrefs, and Screaming Frog. I built an AI tool that produces a full competitive intelligence report in ~3 minutes — real pricing, feature gaps, review sentiment, all from the live web with citations.

$49 for a single competitor analysis. Want me to run one on SEMrush? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Chris Frantz (Loops)"; Search = "Chris Frantz Loops email"; Msg = "Hi Chris — Loops won the 2023 Golden Kitty for email marketing. I built ScopeAI: autonomous AI agents that produce competitive intelligence reports in ~3 minutes. It would research Mailchimp, ConvertKit, and ActiveCampaign on the live web and deliver a cited report on their pricing, features, and strategic gaps.

$99 for a 3-competitor analysis. Would love your feedback as someone who competes directly with these tools. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Zeh Fernandes (Resend)"; Search = "Zeh Fernandes Resend email"; Msg = "Hi Zeh — Resend is API-first email infrastructure competing against SendGrid and Postmark. I built ScopeAI: AI agents that research competitors on the live web and produce a cited intelligence report in ~3 minutes.

$49 for a single competitor deep-dive. Want me to run one on SendGrid or Postmark? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Attio CRM"; Search = "Attio CRM LinkedIn"; Msg = "Hi — Attio is building the next-gen CRM against HubSpot and Salesforce. I built ScopeAI: autonomous AI agents that produce competitive intelligence reports in ~3 minutes — real pricing, feature gaps, review sentiment, all from the live web.

$99 for a 3-competitor analysis on HubSpot, Salesforce, and Pipedrive. Would you try it? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Linear"; Search = "Linear app project management"; Msg = "Hi — Linear is the engineering-first PM tool competing against Asana and Monday. I built ScopeAI: AI agents that research your competitors on the live web and deliver a cited intelligence report in ~3 minutes.

$99 for a 3-competitor analysis. Would love to run one on Asana, Monday, and ClickUp for you to evaluate. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "James Hawkins (PostHog)"; Search = "James Hawkins PostHog"; Msg = "Hi James — PostHog is open-source analytics competing against Mixpanel and Amplitude. I built ScopeAI: autonomous AI agents that produce competitive intelligence reports in ~3 minutes — real pricing, feature gaps, strategic positioning, all from the live web with citations.

$49 for a single competitor deep-dive. Want me to run one on Mixpanel or Amplitude? Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Katelyn Bourgoin"; Search = "Katelyn Bourgoin buyer persona"; Msg = "Hi Katelyn — you help companies understand their buyers and competitive landscape. I built ScopeAI: autonomous AI agents that produce a full competitive intelligence report in ~3 minutes — real pricing, positioning, review sentiment, strategic gaps, all from the live web.

$99 for a 3-competitor analysis. Would love your expert eye on the report quality. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Andy Crestodina"; Search = "Andy Crestodina Orbit Media"; Msg = "Hi Andy — I know competitive research is part of your content strategy work at Orbit Media. I built ScopeAI: AI agents that research competitors on the live web and produce a cited intelligence report in ~3 minutes.

$99 for 3 competitors. Would love your feedback on report quality — happy to run one on a competitor you're tracking. Demo: https://scopeai-746706977308.us-central1.run.app/demo" },
  @{ Name = "Peep Laja"; Search = "Peep Laja Wynter CXL"; Msg = "Hi Peep — Wynter does B2B messaging research. I built ScopeAI: autonomous AI agents that produce competitive intelligence reports in ~3 minutes — real pricing, feature gaps, review sentiment, all from the live web with citations.

$49 for a single competitor analysis. Would love your take on the report structure. Demo: https://scopeai-746706977308.us-central1.run.app/demo" }
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ScopeAI LinkedIn Outreach — Semi-Automated" -ForegroundColor Cyan
Write-Host " $($messages.Count) mensagens para enviar" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para cada contacto:" -ForegroundColor Yellow
Write-Host "  1. Abro o LinkedIn com a pesquisa" -ForegroundColor Yellow
Write-Host "  2. Copio a mensagem para o clipboard" -ForegroundColor Yellow
Write-Host "  3. Tu clicas no perfil, abres Message, colas e envias" -ForegroundColor Yellow
Write-Host "  4. Pressionas ENTER aqui para continuar" -ForegroundColor Yellow
Write-Host ""

for ($i = 0; $i -lt $messages.Count; $i++) {
  $m = $messages[$i]
  Write-Host ""
  Write-Host "[$($i+1)/$($messages.Count)] $($m.Name)" -ForegroundColor Green
  
  # Open LinkedIn search
  $searchUrl = "https://www.linkedin.com/search/results/people/?keywords=" + [uri]::EscapeDataString($m.Search)
  Start-Process $searchUrl
  
  # Copy message to clipboard
  $m.Msg | Set-Clipboard
  
  Write-Host "  -> LinkedIn aberto no browser" -ForegroundColor Gray
  Write-Host "  -> Mensagem copiada para o clipboard (CTRL+V para colar)" -ForegroundColor Gray
  Write-Host "  -> Envia a mensagem e volta aqui" -ForegroundColor Gray
  Write-Host ""
  
  # Wait for user to press Enter
  Read-Host "  Pressiona ENTER quando tiveres enviado"
  
  Write-Host "  ✓ Registado" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " COMPLETO! Todas as $($messages.Count) mensagens enviadas." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
