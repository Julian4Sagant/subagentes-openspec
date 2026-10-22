# Instalación

## Requisitos

- **Claude Code** (CLI, app de escritorio o extensión del IDE).
- **Node.js**, para el hook del tester y el script de verificación.
- **CLI de OpenSpec** (`openspec`), inicializada en el proyecto (`openspec init`). Además de la CLI, deja en `.claude/` las skills y los comandos `/opsx:*`. El implementador usa la skill `openspec-apply-change` y el revisor `openspec-verify-change`.
- **git**, para los worktrees.
- Un proyecto con tests en `src/test` y código en `src/main` (los agentes están pensados para Java con Maven, pero las reglas de rol sirven para otros stacks ajustando las instrucciones).

## Instalar en un proyecto

Desde PowerShell, dentro de la carpeta de este repo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Proyecto C:\ruta\al\proyecto
```

El instalador copia:

| Origen | Destino en el proyecto |
|---|---|
| `agents/*.md` | `.claude/agents/` |
| `hooks/tester-sin-src-main.js` | `.claude/hooks/` |
| `scripts/verificar-displaynames.js` | `.claude/scripts/` |

Después, abrí una sesión nueva de Claude Code en el proyecto: los agentes se cargan al iniciar.

### Por qué en el proyecto y no en `~/.claude`

El tester declara su hook así:

```yaml
command: node "$CLAUDE_PROJECT_DIR/.claude/hooks/tester-sin-src-main.js" --siempre
```

`$CLAUDE_PROJECT_DIR` es la carpeta del proyecto abierto. Si instalás los agentes solo en `~/.claude/agents`, el tester aparece pero su hook no encuentra el script y no te protege. Además, el revisor busca el script de verificación en `.claude/scripts/` del proyecto.

## Comprobar que quedó bien

1. En Claude Code, `/agents` tiene que listar `implementador`, `tester`, `revisor`, `security-auditor` y `postgres-pro`.
2. Probá el hook a mano, desde la carpeta del proyecto:

   ```bash
   echo '{"tool_name":"Read","tool_input":{"file_path":"src/main/App.java"}}' | node .claude/hooks/tester-sin-src-main.js --siempre
   ```

   Tiene que imprimir un JSON con `"permissionDecision":"deny"`. Si no imprime nada, el hook no está bloqueando.
3. Probá el verificador con un archivo de nombres:

   ```bash
   node .claude/scripts/verificar-displaynames.js nombres.txt src/test
   ```

   Imprime cuántos Scenarios tienen test y lista los `SIN TEST`.

## Actualizar

Este repo es la fuente de los agentes. Para tomar una versión nueva, hacé `git pull` acá y volvé a correr el instalador. No edites a mano las copias del proyecto: el próximo instalador las pisa.

## Variantes por proyecto

A veces un proyecto necesita que el agente sepa cosas propias: el stack, las clases base de los tests, las reglas de logs. Por ejemplo, un proyecto puede agregar al tester una sección "El proyecto" con su versión de Java, sus clases de prueba y el formato de errores.

Si tenés una variante:

- Guardala en el repo del proyecto, versionada ahí, no en este repo.
- **No corras el instalador sobre ese proyecto**, o perdés la variante. Copiá solo lo que cambió (por ejemplo, el hook) y aplicá a mano los cambios de las instrucciones.
- Cuando este repo cambie el comportamiento de un agente (un formato de reporte, una regla), llevá el mismo cambio a la variante.
