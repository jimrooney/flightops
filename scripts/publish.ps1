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

$sound = "C:\Home\Jim\System\sounds\gotthis.wav"
if (Test-Path $sound) {
  $player = New-Object System.Media.SoundPlayer $sound
  $player.PlaySync()
}
