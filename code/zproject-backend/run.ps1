# Activa el entorno virtual y arranca el backend
Set-Location $PSScriptRoot
. .\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload