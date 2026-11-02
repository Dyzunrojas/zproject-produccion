# Primer inicio de ZProject (backend): se corre UNA vez en una maquina nueva.
#   .\setup.ps1
# Si PowerShell bloquea el script:
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Green }
function Check($what) { if ($LASTEXITCODE -ne 0) { Write-Host "Fallo: $what" -ForegroundColor Red; exit 1 } }

Step "1/5 Entorno virtual (.venv)"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Check "crear el entorno virtual (esta Python instalado?)"
} else {
    Write-Host ".venv ya existe, se reutiliza"
}
. .\.venv\Scripts\Activate.ps1

Step "2/5 Dependencias (requirements.txt)"
python -m pip install -r requirements.txt
Check "instalar las dependencias"

Step "3/5 Archivo .env"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Se creo .env a partir de .env.example." -ForegroundColor Yellow
    Write-Host "Abrelo y cambia TU_PASSWORD (y la SECRET_KEY, si quieres); luego vuelve a correr .\setup.ps1" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host ".env ya existe"
}

Step "4/5 Base de datos MySQL"
python -m scripts.createDatabase
Check "crear la base de datos"

Step "5/5 Tablas, permisos, rol Administrador y usuario admin (seed)"
python -m scripts.seed
Check "ejecutar el seed"

Write-Host "`nListo. Arranca el backend con:  .\run.ps1" -ForegroundColor Green
