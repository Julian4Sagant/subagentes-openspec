# Flujo del agent graph

Cómo se conectan los agentes para ejecutar el apply de un change de OpenSpec. El orquestador es quien lanza a cada agente, junta sus resultados y habla con la persona.

## Fases

```
            ┌─ tester ──────────────┐
grupo ──────┤                       ├─ join ─ revisor ─┬─ security-auditor (si toca auth, tokens, permisos, errores o secretos)
            └─ implementador (xN) ──┘                  └─ postgres-pro (si toca migraciones o consultas)
                                                           │
                                                 ciclo de corrección
                                                           │
                                                 diff para la persona
```

1. **Paralelo.** El tester escribe los tests de los Scenarios del grupo a partir de la spec, sin leer `src/main`. Al mismo tiempo, un implementador por área de código implementa las tareas del grupo en su propio worktree.
2. **Join.** El orquestador junta los worktrees, compila (`./mvnw -B -q test-compile`) y corre los tests. Esta es la primera vez que los tests del tester tocan el código real.
3. **Revisión.** El revisor revisa el código integrado contra la spec y el design, sin conocer el razonamiento de los implementadores. Corre `scripts/verificar-displaynames.js` para comprobar que cada Scenario tenga su test. El security-auditor y el postgres-pro se suman solo cuando el grupo toca sus áreas.
4. **Ciclo de corrección.** Cada hallazgo se clasifica por el área que lo causa, y el orquestador lo envía al agente correspondiente.
5. **Persona.** Cuando el revisor da `VEREDICTO: APROBADO`, el orquestador muestra el diff a la persona. Si el ciclo llega al límite sin aprobar, la decisión pasa a la persona.

## Ciclo de corrección

| Área del hallazgo | Quién lo corrige | Ejemplo |
|---|---|---|
| `código` | implementador del área | un endpoint no devuelve el `type` de error de la spec |
| `tests` | tester | un `@DisplayName` no coincide letra por letra con el Scenario |
| `artefactos` | la persona, por `/opsx:update` | el design contradice un Scenario |

Reglas:

- **La spec manda.** Si un test contradice la spec, se corrige el test. Si la spec está mal, va a `/opsx:update` y no se arregla ni en el código ni en el test.
- **Máximo 3 iteraciones** por grupo. Pasado el límite sin `APROBADO`, el orquestador le entrega a la persona el último veredicto y el historial de hallazgos.
- **Cada iteración deja rastro:** el veredicto del revisor indica el número de iteración (`Iteración: 1 de 3`).

## Garantías y límites

- **Tester sin código de producción.** El hook `hooks/tester-sin-src-main.js` bloquea lecturas de `src/main` por las herramientas comunes. Es una barrera contra accidentes, no un límite de seguridad. La garantía fuerte es que el worktree del tester no contenga el código de producción.
- **Independencia del revisor.** El revisor recibe la spec, el design y el diff integrado. No recibe el reporte de los implementadores.
- **Costo.** Cada agente lee solo lo que necesita. El revisor y el security-auditor se corren una vez por grupo, no por tarea.
