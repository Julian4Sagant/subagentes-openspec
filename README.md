# Subagentes OpenSpec

Cuatro roles de subagente para el ciclo apply/verify de un change de [OpenSpec](https://github.com/Fission-AI/OpenSpec), escritos una sola vez y adaptados a varios asistentes.

La idea central: **los tests verifican el contrato, no la implementación.** Un agente escribe el código, otro escribe los tests desde la spec sin leer el código, otro revisa lo integrado y, si el cambio toca áreas sensibles, entra un auditor de seguridad. Así un test puede fallar de verdad cuando el código se aparta de la spec.

| Rol | Acceso | Capacidad | Skills | Qué hace |
|---|---|---|---|---|
| `implementador` | escritura | media | reportar-estado, tdd, diagnosticar-fallo, verificar-antes-de-afirmar, recibir-revision | Implementa sus tareas en un alcance declarado |
| `tester` | escritura en tests | media | reportar-estado, tdd, verificar-antes-de-afirmar | Escribe un test por Scenario, sin leer `src/main` |
| `revisor` | lectura | alta | revision-en-dos-pasos, verificar-antes-de-afirmar | Contrasta lo integrado con la spec y da un veredicto |
| `security-auditor` | lectura | alta | verificar-antes-de-afirmar | Revisa autenticación, permisos, logs y secretos |

La **capacidad** (`baja`, `media`, `alta`) indica cuánto razonamiento necesita el rol. Cada host la traduce a su modelo; ver `config/capacidad.json`. Los roles no nombran modelo.

Las **skills** son procedimientos reutilizables en `skills/`. Cada rol las declara y el generador las incluye en su archivo. Además, el orquestador (la sesión principal) usa `orquestar-change` y `entrevista-spec`.

## Hosts

| Host | Cómo se usa | Estado |
|---|---|---|
| Claude Code | subagentes nativos | Formato del repo anterior; sin probar en esta versión |
| OpenCode | subagentes nativos | Parcial |
| Gemini CLI | subagentes nativos | Parcial |
| Codex | `AGENTS.md` y prompts | Sin verificar el formato de subagentes |
| Kimi | `AGENTS.md` y prompts | Sin verificar el formato de subagentes |
| DeepSeek | prompts | Sin soporte de subagentes documentado |

Detalle en [docs/02-hosts.md](docs/02-hosts.md).

## Empezar

```bash
node scripts/instalar.js /ruta/al/proyecto
```

Después, el flujo del change y cómo leer los reportes están en [docs/03-uso.md](docs/03-uso.md). El diseño y lo que se tomó de otros repos, en [docs/01-diseno.md](docs/01-diseno.md).

## Estructura

```
agents/     fuente única de los roles (markdown neutro)
skills/     procedimientos reutilizables que los roles declaran
config/     mapa de capacidad a modelo, por host
dist/       adaptadores generados: claude, opencode, gemini, prompts y AGENTS.md
scripts/    generar y validar, instalar, verificar escritura por git, preparar worktree del tester
scripts/test/  pruebas (node --test, sin dependencias)
licenses/   avisos MIT de los repos de los que se tomaron ideas
docs/       diseño, hosts, uso y fuentes
.github/    CI: valida, prueba y verifica que dist/ esté al día
```

Probado con Node 22 (el de CI). No hay dependencias npm.

## Requisitos de OpenSpec

Los roles usan la CLI `openspec`: `instructions apply --json`, `show --deltas-only` y `validate --strict`. Comprobados contra la 1.16.0; en otras versiones, verificar antes de usar.
