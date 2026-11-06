# Fuentes

Las skills de `skills/` se escribieron de nuevo en español y en el formato del repo. Las ideas y la estructura vienen de tres repos con licencia MIT. Sus avisos de copyright están en [`licenses/`](../licenses).

| Skill | Usada por | Fuente | Qué cambió |
|---|---|---|---|
| `reportar-estado` | implementador, tester | superpowers: `subagent-driven-development` (prompt del implementador, `references/handling-reports.md`) | Estados en español y regla de no reintentar igual. Se quitó el flujo de planes y worktrees de superpowers. |
| `tdd` | implementador, tester | mattpocock/skills: `engineering/tdd`; superpowers: `test-driven-development` | Seams acordados, cortes verticales y anti-patrones. Se quitaron las referencias a skills de otros plugins. |
| `diagnosticar-fallo` | implementador | superpowers: `systematic-debugging`; mattpocock/skills: `engineering/diagnosing-bugs` | Lazo de retroalimentación como condición de entrada. Límite de tres intentos. |
| `verificar-antes-de-afirmar` | implementador, tester, revisor, security-auditor | superpowers: `verification-before-completion` | Tabla de evidencia por afirmación. Se agregó el caso de reportes de agentes. |
| `recibir-revision` | implementador | superpowers: `receiving-code-review` | Ciclo de corrección con evidencia de pruebas en el reporte. |
| `revision-en-dos-pasos` | revisor | superpowers: prompt `task-reviewer`, skill `requesting-code-review` | Dos pasos con veredictos separados. Las pruebas las corre el orquestador en el join. |
| `orquestar-change` | orquestador | intent-driven-template: `openspec-git-discipline`; superpowers: `subagent-driven-development` y `dispatching-parallel-agents` | Compuertas de git, ledger fuera de git y rulings. |
| `entrevista-spec` | orquestador | intent-driven-template: `grill-me`; mattpocock/skills: `engineering/grilling` | Una pregunta por vez, con respuesta recomendada. |

## Qué no se tomó

- Lo específico de cada plataforma: plugins, comandos de instalación, servidores de visualización, hooks y la estructura de carpetas de cada host.
- El modo de diagnóstico de sesiones de superpowers (`diagnosing-superpowers`).
- Las skills de intent-driven sobre Gherkin y ADR. Son opcionales y dependen de la configuración de OpenSpec del proyecto; se pueden agregar si el proyecto las adopta.
- Las skills de mattpocock sobre issues (`triage`, `to-spec`, `to-tickets`), porque asumen un tracker en vez de la spec de OpenSpec.
