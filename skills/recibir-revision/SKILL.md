---
name: recibir-revision
description: Cómo responder a una revisión de código o a sus hallazgos antes de cambiar nada. Úsalo en el ciclo de corrección, cuando el revisor devuelve CAMBIOS REQUERIDOS.
usado_por: implementador
fuente: adaptado de superpowers (MIT), skill receiving-code-review
---

# Recibir una revisión

La revisión exige evaluación técnica, no acuerdo automático. Verificar antes de implementar, y preguntar antes de suponer.

## Proceso

1. **Leé** la revisión completa sin reaccionar.
2. **Reformulá** cada punto con tus palabras. Si no podés, preguntá.
3. **Verificá** cada punto contra el código real.
4. **Evaluá:** ¿es técnicamente correcto para este proyecto?
5. **Respondé:** reconocé lo correcto, o argumentá con razones técnicas lo incorrecto.
6. **Implementá** uno por uno, probando cada cambio.

## Respuestas que no van

- "Tenés toda la razón" o "¡Excelente punto!" sin verificar.
- Implementar antes de entender el punto.
- Aceptar un cambio que rompe algo que funcionaba.

Respondé con hechos: qué cambió y dónde, o por qué el punto no aplica.

## Puntos poco claros

Si alguno de los puntos no está claro, **no implementes nada de ese grupo**. Los puntos suelen estar relacionados, y una comprensión parcial lleva a una corrección incorrecta. Preguntá por los que no entendés y reportá NEEDS_CONTEXT.

## Orden de implementación

1. Bloqueantes: rompen el comportamiento o la seguridad.
2. Arreglos simples: nombres, imports, errores de tipeo.
3. Arreglos complejos: lógica o refactor.

Probá cada uno antes de pasar al siguiente.

## Cuándo empujar atrás

Argumentá con razones técnicas cuando el punto:

- rompe funcionalidad existente;
- parte de un contexto que el revisor no tiene;
- pide algo que no se usa (aplicá YAGNI: si nadie llama a ese código, preguntá si se quita);
- contradice la spec o el diseño. En ese caso no cambies el código: reportá la contradicción como ambigüedad.

Si no podés verificar un punto sin algo que no tenés, decilo: "no puedo verificar esto sin X. ¿Investigo, pregunto o sigo?".

## Ciclo de corrección

Cuando respondés a CAMBIOS REQUERIDOS:

1. Aplicá los cambios aceptados.
2. Corré las pruebas que cubren el código cambiado.
3. Agregá al reporte una sección "Corrección" con: qué cambiaste, el comando que corriste y su salida.

La salida que pegues es la evidencia. El revisor no vuelve a correr la suite.
