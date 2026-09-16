# BYU Football Guess Game - Automated Test Suite Runner
Write-Host "`n🏈 Running BYU Football Guess Game Test Suite...`n" -ForegroundColor Cyan

# Locate Node runner (prefer system node, fallback to agy-node)
$nodeExe = $null
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeExe = "node"
} elseif (Test-Path "$env:APPDATA\Antigravity\bin\agy-node.cmd") {
    $nodeExe = "$env:APPDATA\Antigravity\bin\agy-node.cmd"
} elseif (Test-Path "C:\Program Files\nodejs\node.exe") {
    $nodeExe = "C:\Program Files\nodejs\node.exe"
}

if (-not $nodeExe) {
    Write-Error "Could not find Node.js executable. Please ensure Node.js is installed or run via test.html in your browser."
    exit 1
}

$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host "Using Node engine: $nodeExe" -ForegroundColor DarkGray
Write-Host "Running tests with strict database mutation protection...`n" -ForegroundColor Yellow

& $nodeExe --test tests/scoring.test.js tests/supabase.test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All tests passed successfully with 0 database modifications!`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Check output above.`n" -ForegroundColor Red
}

exit $LASTEXITCODE
