param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Prompt
)

# Join all prompt arguments back into one string
$Prompt = ($Prompt -join " ").Trim()

if (-not $Prompt) {
    Write-Host "Usage: codex-run.ps1 <prompt>"
    exit 1
}

$Repo = "C:\Home\Projects\Code\flightops"
$LogDir = Join-Path $Repo "logs"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $LogDir ("codex-" + $Stamp + ".txt")

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Set-Location $Repo

# Path to Codex CLI node entry point
$Codex = "C:\Users\root\AppData\Roaming\npm\node_modules\@openai\codex\bin\codex.js"

Write-Host ""
Write-Host "Running Codex..."
Write-Host "Prompt: $Prompt"
Write-Host ""

# Run Codex and tee output to log
node $Codex exec "$Prompt" 2>&1 | Tee-Object -FilePath $Log

Write-Host ""
Write-Host "Saved log: $Log"