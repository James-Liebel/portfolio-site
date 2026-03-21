$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$port = 8000
Write-Host "Serving portfolio at http://127.0.0.1:$port/"
Write-Host "Press Ctrl+C to stop the server."
Write-Host ""

if (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server $port
    exit $LASTEXITCODE
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $port
    exit $LASTEXITCODE
}

Write-Error "Python was not found on PATH."
