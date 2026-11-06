# Patrones

Las formas de hacer las cosas que todos los agentes de este repo asumen. Cambiarlas es un cambio del repo, no de un proyecto: si un proyecto necesita otra cosa, lo resuelve en su `CLAUDE.md` o en su `openspec/config.yaml`.

## 1. Lo genérico va acá, lo del proyecto va en el proyecto

- Este repo define **roles, permisos y formatos de reporte**. Son iguales para todos los proyectos.
- Cada proyecto define su **stack, sus reglas y su arquitectura** en `CLAUDE.md`, `openspec/config.yaml` y `docs/flujo-de-trabajo.md`.
- Nunca se edita a mano una copia instalada en `.claude/agents/`. El próximo instalador la pisa, y `verificar-proyecto.js` la marca como desviada.

## 2. El contrato de un proyecto

Un proyecto está listo para los agentes cuando `node scripts/verificar-proyecto.js <ruta>` sale con 0. Ese script comprueba:

| Qué | Por qué |
|---|---|
| `CLAUDE.md` | Stack y reglas, que leen el tester, el revisor, el security-auditor y el postgres-pro. |
| `openspec/config.yaml` con `context:` | Arquitectura y contrato, que lee el implementador. |
| `docs/flujo-de-trabajo.md` con "Al cerrar cada grupo del apply" | El criterio de cierre que usa el revisor. |
| `.claude/hooks/tester-sin-src-main.js` | Sin él, el tester puede leer `src/main`. |
| Los cinco agentes en `.claude/agents/`, idénticos a `agents/` | Que todos los proyectos corran la misma versión de cada rol. |

Opcional pero recomendado: un `GLOSSARY.md` en la raíz con el vocabulario del dominio, que el orquestador y los agentes leen para usar los mismos nombres. Y una carpeta `.out-of-scope/` con una nota por cada propuesta descartada, para que un agente no la vuelva a proponer sin saber por qué se descartó.

## 3. Roles y permisos

| Rol | Escribe | Lee `src/main` | Herramientas de escritura | Guarda |
|---|---|---|---|---|
| `implementador` | Solo código de su área, en su worktree | Sí | `Write`, `Edit` | `sin-escritura.js` (sin git) |
| `tester` | Solo `src/test`, desde la spec | **No** (`tester-sin-src-main.js`) | `Write`, `Edit` | `sin-escritura.js` y el hook de `src/main` |
| `revisor` | Nada | Sí | Ninguna (`Read`, `Grep`, `Glob`, `Bash`) | `sin-escritura.js --solo-lectura` |
| `security-auditor` | Nada | Sí | Ninguna | `sin-escritura.js --solo-lectura` |
| `postgres-pro` | Migraciones y consultas | Sí | `Write`, `Edit` | `sin-escritura.js` |

Regla de integración: **solo el orquestador** marca checkboxes, integra worktrees y commitea. Los agentes reportan y proponen el mensaje de commit.

Regla de la spec: **la spec es la fuente de verdad**. Si un test contradice la spec, o la spec es ambigua, el agente se detiene y lo reporta. No elige una lectura por su cuenta.

## 4. Formatos fijos

Cada agente termina con un reporte de formato fijo, en español. El revisor cierra con una de dos líneas exactas:

```
VEREDICTO: APROBADO
```

```
VEREDICTO: CAMBIOS REQUERIDOS
1. [código|tests|artefactos] archivo:línea — qué cambiar
```

El orquestador lee esa última línea para decidir si vuelve al agente de cada área (máximo 3 vueltas). La [revisión en CI](09-revision-en-ci.md) la lee con `scripts/leer-veredicto.js` para decidir si el check pasa. Por eso un formato que cambia de una versión a otra rompe el flujo: si cambiás un reporte, cambiá también a los que lo leen (`workflows/apply-change.js` y `scripts/leer-veredicto.js`).

## 5. Cómo agregar o cambiar un agente

1. Frontmatter completo: `name` igual al nombre del archivo, `description`, `model` (`haiku`, `sonnet` u `opus`) y `tools` o `hooks` según el rol.
2. Un agente de solo lectura lleva `sin-escritura.js --solo-lectura` y **no** puede tener `Write`, `Edit` ni `NotebookEdit`.
3. Un agente de escritura lleva `sin-escritura.js` sin `--solo-lectura`.
4. Reporte con formato fijo, igual que los demás.
5. Agregalo a la tabla de [README](../README.md) y a [Agentes](04-agentes.md).
6. Corré las validaciones (abajo). CI las corre en cada PR.

## 6. Qué se verifica y dónde

| Comando | Qué comprueba |
|---|---|
| `node scripts/validar-agentes.js` | Frontmatter, guardas, modelos y rutas de hooks y skills. |
| `node --test scripts/test-hooks.js` | Que los hooks bloquean lo que tienen que bloquear. |
| `node --test scripts/test-verificar-proyecto.js` | Que el contrato de proyecto detecta lo que falta o se desvió. |
| `node --test scripts/test-revision-ci.js` | Que la revisión en CI elige bien el change y los agentes, y lee bien los veredictos. |
| `node scripts/validar-workflows.js` | Que el workflow del apply parsea y declara su `meta`. |
| `node scripts/verificar-proyecto.js <ruta>` | Que un proyecto concreto cumple el contrato (paso 2). |

## Límites

Las guardas son una barrera contra errores, no un límite de seguridad. Lo que tiene que estar garantizado se garantiza quitando herramientas (un agente sin `Write` no puede escribir), no con un hook. Ver [Instalación, límites de las guardas](03-instalacion.md#límites-de-las-guardas).
