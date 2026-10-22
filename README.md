# Subagentes OpenSpec

Cinco subagentes de Claude Code para trabajar changes de OpenSpec en equipo, con roles de implementación, tests, revisión, seguridad y base de datos.

| Subagente | Rol | Modo |
|---|---|---|
| `implementador` | Implementa las tareas de un change aprobado en su propio worktree, acotado a su área de código. | Escritura |
| `tester` | Escribe los tests de los Scenarios a partir de la spec, sin ver la implementación. | Escritura |
| `revisor` | Revisa el código integrado contra la spec y el design, y valida el change con la CLI de OpenSpec. | Solo lectura |
| `security-auditor` | Audita cambios que tocan autenticación, tokens, permisos, errores o secretos. | Solo lectura |
| `postgres-pro` | Revisa y diseña migraciones, constraints y consultas de PostgreSQL. | Escritura |

## Flujo

Cómo se conectan los agentes, qué pasa cuando un test falla y cuándo entra cada revisor está en [FLUJO.md](FLUJO.md).

## Instalación

Los agentes se instalan en un proyecto, no en `~/.claude`: el hook del tester se resuelve con `$CLAUDE_PROJECT_DIR`, así que necesita estar en el proyecto. Desde PowerShell, dentro de la carpeta del repo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Proyecto C:\ruta\al\proyecto
```

Esto copia `agents/`, `hooks/` y `scripts/verificar-displaynames.js` a `.claude/` del proyecto. Claude Code los carga al iniciar una sesión nueva.

Este repo es la fuente de los agentes. No edites a mano las copias de cada proyecto: cámbialas acá y vuelve a correr el instalador. Si un proyecto necesita una variante, guárdala en el proyecto y no en este repo. Cada archivo tiene su frontmatter (`name`, `description`, `tools`) y las instrucciones del rol.

## Requisitos

- Claude Code.
- La CLI de [OpenSpec](https://github.com/Fission-AI/OpenSpec) para `tester` y `revisor`.
- Los agentes asumen un flujo con changes de OpenSpec. Si tu proyecto usa otro stack, ajusta las secciones de proyecto dentro de cada archivo.

## Notas

- Los agentes de solo lectura (`revisor`, `security-auditor`) no modifican código.
- Ninguno de los archivos contiene claves, tokens ni datos reales.
