# Requires: STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY filled in .env
# Creates the Stripe webhook endpoint for the production Cloud Run URL,
# writes STRIPE_WEBHOOK_SECRET back to .env, and updates Cloud Run env vars.

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "..\.env"
$lines = Get-Content $envFile
$vars = @{}
foreach ($l in $lines) {
  if ($l -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') { $vars[$Matches[1]] = $Matches[2].Trim() }
}

$sk = $vars["STRIPE_SECRET_KEY"]
$pk = $vars["STRIPE_PUBLISHABLE_KEY"]
if (-not $sk -or $sk -notmatch '^sk_(live|test)_') { throw "STRIPE_SECRET_KEY missing/invalid in .env" }
if (-not $pk -or $pk -notmatch '^pk_(live|test)_') { throw "STRIPE_PUBLISHABLE_KEY missing/invalid in .env" }

$runUrl = "https://scopeai-746706977308.us-central1.run.app/api/webhook"

Write-Host "Creating Stripe webhook endpoint -> $runUrl"
$resp = curl.exe -s -X POST "https://api.stripe.com/v1/webhook_endpoints" `
  -u "${sk}:" `
  -d "url=$runUrl" `
  -d "enabled_events[]=checkout.session.completed" | ConvertFrom-Json

if ($resp.error) { throw "Stripe error: $($resp.error.message)" }
$whsec = $resp.secret
Write-Host "Webhook created: $($resp.id) (secret whsec_...)"

$newLines = $lines | ForEach-Object {
  if ($_ -match '^\s*STRIPE_WEBHOOK_SECRET\s*=') { "STRIPE_WEBHOOK_SECRET=$whsec" } else { $_ }
}
Set-Content -Path $envFile -Value $newLines
Write-Host ".env updated with STRIPE_WEBHOOK_SECRET"

Write-Host "Updating Cloud Run env vars..."
gcloud run services update scopeai --region us-central1 `
  --update-env-vars "STRIPE_SECRET_KEY=$sk" `
  --update-env-vars "STRIPE_PUBLISHABLE_KEY=$pk" `
  --update-env-vars "STRIPE_WEBHOOK_SECRET=$whsec" | Select-Object -Last 2

Write-Host ""
Write-Host "DONE. Test with a real card (live mode) or 4242 4242 4242 4242 (test mode)."
