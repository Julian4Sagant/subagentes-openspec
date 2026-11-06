---
name: revision-en-dos-pasos
description: Procedimiento de revisión de código integrado en dos pasos, cumplimiento de la spec y después calidad, con hallazgos ubicados en archivo y línea. Úsalo al revisar un grupo de tareas o un change completo.
usado_por: revisor
fuente: adaptado de superpowers (MIT), prompt task-reviewer y skill requesting-code-review
---

# Revisión en dos pasos

Primero se verifica que el código hace lo que pide la spec. Después, que está bien construido. Son veredictos separados: un código puede cumplir la spec y estar mal hecho, y eso también es un hallazgo.

## No confíes en el reporte

El reporte del implementador son afirmaciones sin verificar. Pueden estar incompletas, ser inexactas u optimistas. Verificá cada afirmación contra el diff.

Una justificación de diseño ("lo dejé así por simplicidad") no baja la severidad de un hallazgo. Juzgá el código, no la explicación.

## Paso 1: cumplimiento de la spec

Compará el diff con los requisitos de la tarea. Clasificá cada desvío:

- **Faltante:** un requisito que no se implementó o que se declaró y no existe.
- **Extra:** funcionalidad no pedida, sobreingeniería o "mejoras" sin requisito.
- **Malinterpretado:** se construyó la funcionalidad correcta de la forma incorrecta, o se resolvió otro problema.

Si la tarea lista varios archivos con cambios propios, cada archivo listado debe tener su parte del diff. Un archivo listado que el diff no toca es un faltante, aunque el resto esté bien.

Si un requisito no se puede verificar solo con el diff (vive en código sin cambios o abarca varias tareas), no busques más: reportalo como ⚠️ para que el orquestador lo resuelva.

## Paso 2: calidad

- **Lógica:** manejo de errores, casos borde, estados compartidos.
- **Pruebas:** verifican comportamiento real, no mocks de mocks. Cubren los bordes de la tarea.
- **Estructura:** cada archivo tiene una responsabilidad clara. Los archivos nuevos no son grandes desde el inicio. Un cambio no debe hacer crecer un archivo existente más de lo que la tarea justifica. No marques el tamaño previo de archivos que este cambio no tocó.
- **Duplicación:** lógica repetida en bloque, no duplicación razonable.

## Severidad

- **Bloqueante:** no se puede confiar en el cambio hasta arreglarlo. Incluye contradicciones con la spec, pruebas que no verifican nada y errores silenciados.
- **Importante:** debe arreglarse, pero no invalida el cambio entero.
- **Menor:** mejora opcional. No bloquea.

"Podría tener más cobertura" y los detalles de estilo son menores.

## Evidencia

Cada hallazgo lleva archivo:línea, qué pasa, qué sección de la spec contradice y cómo arreglarlo. Cada verificación que responderías con un "sí" sin más, respáldala con una línea concreta.

## Pruebas

La suite la corre el orquestador después de integrar. No la vuelvas a correr para confirmar el reporte. Solo corré una prueba focal si una duda concreta sobre el código no se resuelve leyéndolo, y decí qué duda resolviste. Si hace falta una validación pesada, recomendala en el reporte en vez de correrla.

## Orden del reporte

1. Fortalezas concretas: qué está bien hecho, con referencias. Va primero para que el implementador confíe en el resto de la revisión.
2. Paso 1: cumplimiento, con ✅, ❌ o ⚠️.
3. Paso 2: calidad, por severidad.
4. Lo que verificaste y está bien.

Terminá con el veredicto de formato fijo que define tu rol.
