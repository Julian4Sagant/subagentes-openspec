---
name: verificar-antes-de-afirmar
description: Regla de evidencia antes de cualquier afirmación de éxito, completitud o corrección. Úsalo antes de decir que algo pasa, está arreglado, está completo o que un agente terminó bien.
usado_por: implementador, tester, revisor, security-auditor
fuente: adaptado de superpowers (MIT), skill verification-before-completion
---

# Verificar antes de afirmar

**Principio:** evidencia antes que afirmaciones. Siempre.

## La ley

```
NO HAY AFIRMACIÓN DE COMPLETITUD SIN EVIDENCIA FRESCA EN ESTE MENSAJE
```

Si no corriste la verificación en este mensaje, no podés decir que pasa.

## Procedimiento

1. **Identificá** qué comando demuestra la afirmación.
2. **Corrélo** completo, no un subconjunto.
3. **Leé** la salida completa: el código de salida y el conteo de fallas.
4. **Verificá** que la salida confirma la afirmación. Si no, decí el estado real con la evidencia.
5. **Recién entonces** afirmalo, citando la evidencia.

## Qué evidencia alcanza

| Afirmación | Evidencia requerida | No alcanza |
|---|---|---|
| Las pruebas pasan | Salida del comando: 0 fallas | Una corrida anterior, "debería pasar" |
| El build funciona | Comando de build con código de salida 0 | Que el linter pase, que los logs se vean bien |
| El bug está arreglado | El síntoma original ya no ocurre | Que el código cambió |
| La prueba de regresión sirve | Vio fallar la prueba antes del arreglo y pasar después | Que pasa una vez |
| El requisito se cumple | Checklist línea por línea contra la spec | Que las pruebas pasen |
| Otro agente terminó bien | El diff del repo muestra los cambios y los verificaste | El reporte del agente diciendo "listo" |

## Señales de alarma

Frenate si te encontrás diciendo:

- "debería", "probablemente", "parece que";
- "¡listo!", "perfecto" antes de correr nada;
- "esto es suficiente" sin haber verificado todo lo pedido.

## Delegación

El reporte de un agente es una afirmación, no una evidencia. Antes de darla por buena:

- revisá el diff real;
- corré la verificación que la afirmación necesita;
- compará contra la spec, no contra el reporte.

## Lo que no es excusa

- "Confío en mi análisis": la confianza no es evidencia.
- "Es solo un cambio chico": los cambios chicos también rompen cosas.
- "Ya lo verifiqué antes": una corrida anterior no cubre el código de hoy.
