param(
  [string]$Message = "Publish updates"
)

$ErrorActionPreference = "Stop"

git add -A

$pending = git diff --cached --name-only
if (-not $pending) {
  Write-Host "No staged changes to publish."
} else {
  git commit -m $Message
}

git push origin HEAD

Write-Host "Deploying Cloudflare Worker..."
npm run cf:deploy
if ($LASTEXITCODE -ne 0) {
  throw "Cloudflare Worker deploy failed."
}

$head = (git rev-parse --short HEAD).Trim()
$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Publish + Cloudflare Worker deploy completed, but working tree is not clean."
} else {
  Write-Host "Publish + Cloudflare Worker deploy completed successfully at commit $head."
}
[Console]::Out.Flush()

try {
  $apiBase = if ($env:FLIGHTOPS_API_BASE) { $env:FLIGHTOPS_API_BASE.TrimEnd("/") } else { "https://api.flightops.co.nz" }
  $password = if ($env:FLIGHTOPS_UI_PASSWORD) { $env:FLIGHTOPS_UI_PASSWORD } else { "pizza" }
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

  Invoke-WebRequest -Uri "$apiBase/auth?next=%2Fdashboard" -Method Post -WebSession $session -Body @{ password = $password } -UseBasicParsing | Out-Null
  Invoke-RestMethod -Uri "$apiBase/admin/publish-signal" -Method Post -WebSession $session | Out-Null
  Write-Host "Publish signal sent for browser completion sound."
} catch {
  Write-Host "Publish signal skipped: $($_.Exception.Message)"
}

$sound = "C:\Home\Jim\System\sounds\gotthis.wav"
if (Test-Path $sound) {
  # Try delayed background playback first; fall back to local sync playback.
  $played = $false
  try {
    $cmd = "Start-Sleep -Milliseconds 900; " +
           "`$p = New-Object System.Media.SoundPlayer '$sound'; " +
           "`$p.PlaySync()"
    Start-Process -WindowStyle Hidden -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-Command", $cmd | Out-Null
    $played = $true
  } catch {
    $played = $false
  }

  if (-not $played) {
    $player = New-Object System.Media.SoundPlayer $sound
    $player.PlaySync()
  }
}
