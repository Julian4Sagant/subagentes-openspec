# Flujo de trabajo de un change (ejemplo)

Ejemplo mínimo de `docs/flujo-de-trabajo.md`, que citan `implementador` y `revisor`.
Los pasos de apply y de revisión son los que usan los agentes. Ajustá los nombres
a los de tu proyecto.

1. `/opsx:explore`: pensar el cambio antes de proponerlo (salvo cambios triviales).
2. `/opsx:propose`: generar proposal, design, specs y tasks. Una persona aprueba.
3. Crear la rama `change/<change-id>`.
4. Actualizar la spec antes que el código, si el cambio la modifica.
5. Asignar las tareas de `tasks.md` por área de código.
6. Apply (paso 10): el tester escribe los tests de los Scenarios y los implementadores
   trabajan en sus worktrees, en paralelo.
7. Join: integrar las áreas y compilar con los tests.
8. Revisión: el `revisor` contra spec y design. Si hay `CAMBIOS REQUERIDOS`, vuelve al
   agente de su área, hasta 3 vueltas.
9. Al cerrar cada grupo del apply, verificar que las tareas marcadas están cumplidas.
10. Una persona revisa el diff y aprueba el PR.
11. `/opsx:archive` como último commit del branch, antes del merge.
