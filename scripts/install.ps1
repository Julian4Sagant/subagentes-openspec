# Instala los agentes, el hook y el script de verificación en un proyecto.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Proyecto C:\ruta\al\proyecto
# El hook del tester se resuelve con $CLAUDE_PROJECT_DIR, así que los agentes van al proyecto
# y no a ~/.claude, donde el hook no encontraría su script.
param([Parameter(Mandatory)][string]$Proyecto)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Proyecto -PathType Container)) {
	throw "No existe el proyecto: $Proyecto"
}

$raiz = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $Proyecto '.claude'
New-Item -ItemType Directory -Force -Path (Join-Path $destino 'agents'), (Join-Path $destino 'hooks'), (Join-Path $destino 'scripts') | Out-Null

Copy-Item (Join-Path $raiz 'agents\*.md') (Join-Path $destino 'agents') -Force
Copy-Item (Join-Path $raiz 'hooks\*.js') (Join-Path $destino 'hooks') -Force
Copy-Item (Join-Path $raiz 'scripts\verificar-displaynames.js') (Join-Path $destino 'scripts') -Force

Write-Host "Agentes, hooks y scripts instalados en $destino"
