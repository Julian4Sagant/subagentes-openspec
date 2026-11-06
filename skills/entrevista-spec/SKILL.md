---
name: entrevista-spec
description: Entrevista a la persona antes de redactar una propuesta de OpenSpec, para aclarar decisiones, alcance y riesgos hasta llegar a un entendimiento compartido. Úsalo cuando la persona quiere poner a prueba un plan o un diseño.
usado_por: orquestador
fuente: adaptado de intent-driven-template (MIT), skill grill-me, y de mattpocock/skills (MIT), skill engineering/grilling
---

# Entrevista de la spec

Llegá a un entendimiento compartido del plan antes de escribir la propuesta. Recorré cada rama de decisión y resolvé sus dependencias de una en una.

## Reglas

- **Una pregunta por vez.**
- **Cada pregunta trae tu respuesta recomendada.** La persona puede aceptarla, corregirla o cambiarla. Así la conversación avanza aunque no tenga una respuesta obvia.
- **Si la respuesta está en el código, buscala en el código.** No preguntes lo que podés verificar.
- **Empezá por las decisiones que condicionan a las demás.** Las dependencias primero.
- **Registrá cada decisión** con su motivo. Va a la propuesta, y el ledger guarda la referencia.

## Qué cubrir

- Usuarios y resultados esperados.
- Alcance y no alcance explícito.
- Límites de confianza: qué datos o acciones son sensibles, y quién puede hacer qué.
- Riesgos conocidos y cómo se detectarían.
- Criterios de aceptación observables. Un criterio que no se puede probar no sirve.
- Preguntas abiertas que la persona no sabe contestar todavía. Anotalas como supuestos, no como decisiones.

## Cierre

La entrevista termina cuando podés resumir el plan en un párrafo y la persona confirma que el resumen es correcto. Después redactá la propuesta. Si el resumen cambia algo, volvé a entrevistar antes de escribir.
