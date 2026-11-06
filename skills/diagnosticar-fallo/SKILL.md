---
name: diagnosticar-fallo
description: Procedimiento para encontrar la causa raíz de un fallo de prueba, un bug o un comportamiento inesperado antes de proponer un arreglo. Úsalo ante cualquier falla que no entiendas.
usado_por: implementador
fuente: adaptado de superpowers (MIT), skill systematic-debugging, y de mattpocock/skills (MIT), skill engineering/diagnosing-bugs
---

# Diagnosticar un fallo

**Principio:** primero la causa raíz, después el arreglo. Un arreglo sobre un síntoma es una falla del proceso, aunque la prueba pase.

## La ley

```
NO HAY ARREGLO SIN CAUSA RAÍZ INVESTIGADA
```

## Fase 1: lazo de retroalimentación

Antes de leer código para formar una teoría, necesitás un **comando único** que:

- **reproduzca el síntoma exacto** del usuario o de la prueba, no un fallo cercano;
- **dé el mismo veredicto en cada corrida** (si es intermitente, subí la tasa de reproducción con repeticiones y estrés controlado);
- **tarde segundos**, no minutos;
- **pueda correrse sin intervención humana**.

Si no podés construir ese lazo, no sigas: reportá BLOCKED con lo que intentaste y qué te falta (un entorno, un registro capturado, permiso para instrumentar).

## Fase 2: reproducir y minimizar

- Corré el lazo y confirmá que falla como describe el síntoma.
- Quitá entradas, configuración y pasos de a uno, y volvé a correr después de cada quita. Quedate con lo mínimo que sigue fallando.

## Fase 3: hipótesis

- Formulá 3 a 5 hipótesis ordenadas por probabilidad, antes de probar ninguna.
- Cada una debe ser falsable: "si la causa es X, cambiar Y hace desaparecer el fallo".
- Si no podés escribir esa predicción, la hipótesis no sirve todavía.
- Probá una hipótesis por vez y cambiá una sola variable.

## Fase 4: instrumentar en los bordes

Si el fallo cruza varios componentes (entrada → servicio → base, por ejemplo), registrá qué entra y qué sale en cada borde, y corré una vez. El registro muestra en qué componente se rompe. Después investigá solo ese componente.

Al rastrear un valor malo, seguí hacia atrás hasta su origen y corregí ahí, no en el lugar donde se ve el error.

## Fase 5: arreglo y verificación

1. Escribí la prueba de regresión que reproduce el síntoma mínimo (ver la skill `tdd`).
2. Corregí en el origen identificado.
3. Corré el lazo de la fase 1: tiene que pasar.
4. Corré la suite del área: no puede haber regresiones.

## Límite de intentos

Si tres arreglos sucesivos no resuelven el fallo, paráte. Cada intento fallido es evidencia de que la hipótesis de partida está mal, o de que el problema es arquitectónico. Reportá BLOCKED con la lista de hipótesis descartadas y sus pruebas. No intentes un cuarto arreglo sin un dato nuevo.

## Datos sensibles

Antes de mostrar comandos, salidas o registros, reemplazá credenciales y tokens por `<REDACTADO>`. Pasá los secretos por variables de entorno para que no aparezcan en lo que mostrás.
