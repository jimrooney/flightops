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
