# Diseño

## Qué problema resuelve

Si el mismo agente escribe el código y sus tests, tiende a ajustar los tests hasta que pasan. Separar los roles hace que un test pueda fallar de verdad cuando el código se aparta de la spec. El repo define esos roles, sus permisos y sus formatos de reporte, de forma que cualquier asistente pueda ejecutarlos.

## Principios

1. **Independencia del modelo.** Ningún archivo de `agents/` nombra un modelo ni un host. La validación (`validar-agentes.js`) falla si aparece `haiku`, `sonnet`, `gemini`, `.claude/` o similares. El modelo lo elige quien usa el host.
2. **Una sola fuente.** `agents/` es la verdad. `dist/` se genera y CI verifica que coincida. Nadie edita `.claude/agents/` a mano en un proyecto.
3. **La spec manda.** Si un test contradice la spec, o la spec es ambigua, el agente se detiene y lo reporta. No elige una lectura.
4. **Formato fijo de reporte.** El orquestador lee el veredicto con una regla exacta. Cambiar un formato rompe el flujo, así que los formatos viven en el rol y los valida el script.
5. **Verificación fuera del agente.** Un agente de solo lectura puede equivocarse con sus herramientas o con su lista de permisos. `verificar-escritura.js` mira lo que cambió en git y no confía en el reporte del agente.
6. **Mínimo.** Cuatro roles. Lo que no se usa en un flujo real no entra. Los roles específicos de un stack (por ejemplo, un especialista en base de datos) van en el proyecto, no acá.

## Roles

| Rol | Acceso | Capacidad | Qué hace | Cuándo |
|---|---|---|---|---|
| `implementador` | escritura | media | Implementa sus tareas dentro de un alcance declarado | Siempre, uno por área que no se pisa |
| `tester` | escritura en tests | media | Escribe un test por Scenario desde la spec, sin leer `src/main` | Siempre, en paralelo con los implementadores |
| `revisor` | lectura | alta | Contrasta el código integrado con la spec y da un veredicto | Después de integrar un grupo |
| `security-auditor` | lectura | alta | Revisa autenticación, permisos, errores, logs y secretos | Solo si el cambio toca esas áreas |

## Skills

Cada rol declara las skills que necesita. Una skill es un procedimiento con su criterio de uso, por ejemplo cómo diagnosticar un fallo o cómo reportar un estado. El generador incluye el contenido de cada skill dentro del archivo del rol, así que el rol no depende de que el host sepa cargar skills.

La capacidad no es un modelo. Un rol de capacidad `alta` pide el modelo más capaz que el host ofrezca, y el mapa de `config/capacidad.json` decide cuál es. Los hosts sin mapa usan su modelo por defecto.

## Qué se tomó de otros repos

Detalle por skill y licencias en [Fuentes](04-fuentes.md).

- **De `cloudflare/security-audit-skill`:** separar modo guía de modo completo; el padre es el único que escribe el estado compartido; un verificador en contexto fresco intenta refutar; validadores sin dependencias para la salida; roles abstractos en lugar de nombres de modelo.
- **De `ayush488-glitch/genesis-kit`:** guías por fase cortas y neutrales al host; compuertas humanas entre spec, plan e implementación; cierre que exige evidencia, no el reporte del agente; una capa fina por host sobre un contenido canónico; y el criterio de que los agentes innecesarios son defectos.
- **De `obra/superpowers`, `mattpocock/skills` e `intent-driven-template`:** los procedimientos de las skills, reescritos en español. Estados de reporte, TDD en cortes verticales, diagnóstico por lazo de retroalimentación, evidencia antes de afirmar, revisión en dos pasos, compuertas de git de OpenSpec y entrevista previa a la propuesta.

Ideas que se dejaron afuera: su CLI, dashboard, servidor MCP, grafo de código (solo indexa JS, TS y Python), autonomía y promoción de reglas. Es una plataforma completa, y para el ciclo de OpenSpec basta con los formatos, las skills y los verificadores.

## Qué se quitó del repo anterior

- Hooks de Claude Code (`PreToolUse`). No existen en todos los hosts; el aislamiento pasa a ser git y los verificadores.
- La herramienta Workflow y `workflows/`. Dependía de Claude Code; el orden del flujo ahora está en `docs/03-uso.md`.
- `postgres-pro`. Es específico de un stack.
- Las skills de mattpocock. Eran de Claude Code y tenían su propio instalador. Siguen en el historial de `main`, junto con su licencia.

Nada de esto se borró de la historia: `main` no se tocó.
