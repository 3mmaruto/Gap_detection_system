$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"

function Test-PortInUse {
    param([int]$Port)

    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
    return $null -ne $connection
}

function Start-ServiceWindow {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )

    Start-Process powershell.exe -WorkingDirectory $WorkingDirectory -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    ) | Out-Null
}

if (-not (Test-Path $venvPython)) {
    Write-Host ""
    Write-Host "Backend virtual environment not found." -ForegroundColor Yellow
    Write-Host "Expected path:" -ForegroundColor Yellow
    Write-Host "  $venvPython" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create it first with:" -ForegroundColor Cyan
    Write-Host "  cd `"$backendDir`"" -ForegroundColor Cyan
    Write-Host "  py -m venv .venv" -ForegroundColor Cyan
    Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Cyan
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Cyan
    exit 1
}

$backendPort = 8080
$frontendPort = 5500

Write-Host ""
Write-Host "Gap Detection System local preview launcher" -ForegroundColor Green
Write-Host "Repository: $repoRoot"
Write-Host ""

if (Test-PortInUse -Port $backendPort) {
    Write-Host "Backend port $backendPort is already in use. Skipping backend start." -ForegroundColor Yellow
} else {
    Start-ServiceWindow `
        -Title "Gap Detection Backend" `
        -WorkingDirectory $backendDir `
        -Command "& `"$venvPython`" -m uvicorn app.main:app --host 127.0.0.1 --port $backendPort --reload"
    Write-Host "Backend starting on http://127.0.0.1:$backendPort" -ForegroundColor Cyan
}

if (Test-PortInUse -Port $frontendPort) {
    Write-Host "Frontend port $frontendPort is already in use. Skipping frontend start." -ForegroundColor Yellow
} else {
    Start-ServiceWindow `
        -Title "Gap Detection Frontend" `
        -WorkingDirectory $frontendDir `
        -Command "& `"$venvPython`" -m http.server $frontendPort"
    Write-Host "Frontend starting on http://127.0.0.1:$frontendPort/index.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Open these URLs in your browser:" -ForegroundColor Green
Write-Host "  Frontend  : http://127.0.0.1:$frontendPort/index.html"
Write-Host "  Analytics : http://127.0.0.1:$frontendPort/analytics.html"
Write-Host "  Backend   : http://127.0.0.1:$backendPort/health"
Write-Host ""
Write-Host "API base URL inside the app:" -ForegroundColor Green
Write-Host "  http://127.0.0.1:$backendPort"
Write-Host ""

