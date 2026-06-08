$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $root "src\config\runtimeConfig.js"
$distPath = Join-Path $root "dist\index.html"
$serverScript = Join-Path $root "tools\local-demo-server.mjs"
$buildScript = Join-Path $root "tools\build-standalone.mjs"

if (-not (Test-Path $configPath)) {
  throw "Missing runtime config: $configPath"
}

$config = Get-Content -Raw -Encoding UTF8 -LiteralPath $configPath
$match = [regex]::Match($config, 'MINIMAX_API_KEY:\s*"([^"]*)"')
$apiKey = $match.Groups[1].Value.Trim()

if (-not $apiKey) {
  $apiKey = Read-Host "Paste MiniMax API Key"
}

if (-not $apiKey) {
  throw "MiniMax API Key is empty."
}

$env:LLM_MOCK_ENABLED = "false"
$env:MINIMAX_API_KEY = $apiKey
$env:MINIMAX_MODEL = "MiniMax-M2.7"

Write-Host ""
Write-Host "Starting local demo server..."
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node command 'node' was not found in this terminal."
}

node $buildScript

$serverCommand = "cd '$root'; `$env:MINIMAX_API_KEY='$apiKey'; `$env:MINIMAX_MODEL='MiniMax-M2.7'; node '$serverScript'"

Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", $serverCommand

$url = "http://localhost:8787/index.html"
$ready = $false

for ($i = 0; $i -lt 20; $i++) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 1
  }
}

if (-not $ready) {
  Write-Host "Local server is still starting. Refresh this page in a moment:"
  Write-Host $url
  Start-Process $url
  exit 0
}

Write-Host "Backend is ready. Opening demo:"
Write-Host $url
Start-Process $url
