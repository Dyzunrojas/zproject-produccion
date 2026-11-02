# Corre todas las pruebas y genera la evidencia.
#   .\test.ps1            -> pruebas del backend
#   .\test.ps1 -Front     -> ademas, las pruebas del frontend
# Si PowerShell bloquea el script:
#   powershell -ExecutionPolicy Bypass -File .\test.ps1
param([switch]$Front)

Set-Location $PSScriptRoot
. .\.venv\Scripts\Activate.ps1

# Instala pytest y compania solo si faltan
python -c "import pytest, pytest_cov, httpx" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Instalando herramientas de prueba..." -ForegroundColor Yellow
    python -m pip install -r requirements-dev.txt
}

Write-Host "`n==> Pruebas del backend (resultado + cobertura)" -ForegroundColor Green
python -m pytest -v --junitxml=results.xml --cov=app --cov-report=term-missing --cov-report=html
$backendExit = $LASTEXITCODE

Write-Host "`n==> Tabla de evidencia" -ForegroundColor Green
python scripts/testReport.py
if (Test-Path "evidencia.html") { Start-Process "evidencia.html" }

$frontExit = 0
if ($Front) {
    Write-Host "`n==> Pruebas del frontend" -ForegroundColor Green
    Push-Location "..\zproject-frontend"
    npm test
    $frontExit = $LASTEXITCODE
    Pop-Location
}

Write-Host ""
if ($backendExit -eq 0 -and $frontExit -eq 0) {
    Write-Host "Todas las pruebas pasaron." -ForegroundColor Green
} else {
    Write-Host "Hay pruebas que fallaron: revisa la salida de arriba." -ForegroundColor Red
    exit 1
}
Write-Host "Cobertura en HTML: htmlcov\index.html"
