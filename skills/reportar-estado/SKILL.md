---
name: reportar-estado
description: Contrato de estado al terminar una tarea. Úsalo para decidir entre DONE, DONE_WITH_CONCERNS, BLOCKED o NEEDS_CONTEXT, y para escalar sin inventar trabajo.
usado_por: implementador, tester
fuente: adaptado de superpowers (MIT), skill subagent-driven-development, prompt de implementador y references/handling-reports.md
---

# Reportar estado

Cada rol termina con un estado. El orquestador actúa sobre ese estado, así que tiene que ser exacto.

## Estados

- **DONE:** la tarea está completa, probada y dentro del alcance. Tenés evidencia en el reporte.
- **DONE_WITH_CONCERNS:** la tarea está completa, pero tenés una duda sobre su corrección o su alcance. Describí la duda en una línea concreta.
- **BLOCKED:** no podés completar la tarea. Explicá qué intentaste, qué te frena y qué tipo de ayuda necesitás.
- **NEEDS_CONTEXT:** falta información que no está en las entradas. Decí exactamente qué información falta.

## Reglas

- **No entregues trabajo del que no estás seguro sin marcarlo.** Si dudás, usá DONE_WITH_CONCERNS o BLOCKED.
- **Escalar es una salida válida.** Es mejor un BLOCKED honesto que un DONE dudoso. Nadie te penaliza por escalar.
- **Escalá cuando:**
  - la tarea exige una decisión de arquitectura con varias opciones válidas;
  - necesitás entender código que no te dieron y no encontrás la respuesta en el alcance;
  - la spec contradice el diseño o es ambigua;
  - llevás varios intentos sin avanzar.
- **No reintentes igual.** Si el orquestador te devuelve una tarea que escalaste, cambia algo: más contexto, otro nivel de capacidad o una tarea más chica. Un reintento sin cambios repite el fallo.
- **Las dudas van en el mensaje final**, no solo en el archivo de reporte. El orquestador lee primero el mensaje.

## Bloque final

Terminá siempre con este bloque, en menos de 15 líneas. El detalle va en el reporte del rol.

```
ESTADO: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
EVIDENCIA: <comando y resultado, o "no aplica">
DUDAS: <una línea por duda, o "ninguna">
NECESITO: <solo si BLOCKED o NEEDS_CONTEXT>
```
