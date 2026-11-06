---
name: orquestar-change
description: Procedimiento para la sesión principal que coordina subagentes sobre un change de OpenSpec, con compuertas de git, ledger de progreso, grupos de tareas y aprobación humana. Úsalo al aplicar un change.
usado_por: orquestador
fuente: adaptado de intent-driven-template (MIT), skill openspec-git-discipline, y de superpowers (MIT), skills subagent-driven-development y dispatching-parallel-agents
---

# Orquestar un change

Vos coordinás. No implementás, no revisás y no escribís tests: eso lo hacen los roles. Tu trabajo es el orden, las compuertas y el registro.

## Compuertas de git

Antes de cada fase, verificá:

1. **Propuesta:** la propuesta de OpenSpec debe estar en `main` antes de aplicar. Podés redactarla en una rama, pero el apply no empieza hasta que esté integrada.
2. **Apply:** corre desde `main`, una rama o un worktree, solo si la propuesta ya está en `main`. Corré `git status --short` y confirmá que no hay archivos del change sin commitear.
3. **Archive:** corre solo desde `main`, y solo después de integrar la implementación. Corré `git branch --show-current` y `git status --short`. Si no estás en `main` o falta integrar, detenete.

Nunca crees commits, ramas ni merges sin pedido explícito de la persona.

## Ledger

Mantené un archivo de progreso fuera de git, en una carpeta ignorada (por ejemplo, `.subagentes/ledger-<change>.md`). Su primera línea identifica el change.

Registrá:

- cada grupo de tareas y su estado;
- los commits y los reportes de cada rol, con su estado;
- cada decisión menor, con la forma `Ruling: qué decidiste — por qué — costo si estás equivocado`.

Después de una compactación de contexto, confiá en el ledger y en `git log`, no en tu memoria. Así no volvés a lanzar tareas ya hechas.

## Grupo de tareas

1. **Preparar:** un worktree por implementador, con alcance de archivos declarado. El tester usa `scripts/preparar-worktree-tester.sh` con `src/main` excluido.
2. **Instantánea:** `node scripts/verificar-escritura.js guardar` en cada worktree antes de lanzar el rol.
3. **Lanzar** implementadores y tester. Pasales solo lo que necesitan: su rol, su alcance, las tareas y el change. Nada del historial de la sesión.
4. **Comprobar alcance** con `comparar --permitido`. Un fallo se corrige antes de seguir.
5. **Leer el estado** de cada reporte con la skill `reportar-estado`:
   - `DONE`: sigue.
   - `DONE_WITH_CONCERNS`: leé las dudas. Si son de corrección o alcance, resolvelas antes de integrar.
   - `NEEDS_CONTEXT`: dá el contexto que falta y volvé a lanzar el mismo rol.
   - `BLOCKED`: no reintentes igual. Dá más contexto, cambiá la capacidad del rol o parte la tarea. Si el plan está mal, registrá la decisión en el ledger.
6. **Integrar** los worktrees en el branch del change, compilar y correr la suite completa. Este es el primer momento en que el tester toca código real.
7. **Revisar:** lanzá el `revisor` sobre lo integrado. Si devuelve `CAMBIOS REQUERIDOS`, devolvé cada punto al área que indica (código, tests o artefactos). Máximo tres vueltas. Después, decide la persona.
8. **Seguridad:** si el grupo toca autenticación, permisos, errores, logs o secretos, lanzá también el `security-auditor`.
9. **Aprobación:** mostrá el diff a la persona. Recién cuando aprueba, marcá las tareas y commiteá.

## Cuándo detenerte y preguntar

Parate y pregunta cuando:

- la spec o el diseño tienen una ambigüedad que cambia el comportamiento;
- hay que hacer un merge, un push a un branch compartido o publicar algo;
- una acción sería destructiva o difícil de revertir;
- un rol pide salirse del alcance declarado;
- el plan aprobado ya no sirve.

Las decisiones menores (nombres, orden de tareas dentro de un grupo, un supuesto que no cambia el comportamiento) van al ledger como rulings. No detengas el trabajo por ellas.

## Cierre

Antes de archivar, lanzá el `revisor` sobre el change completo. Después, en tu mensaje final, listá todos los rulings que tomaste, en orden, cada uno con su costo si está mal. Es la única forma en que la persona ve las decisiones que tomaste por ella.
