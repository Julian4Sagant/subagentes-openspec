---
name: tdd
description: Desarrollo guiado por pruebas en cortes verticales. Úsalo cuando una tarea implementa comportamiento o corrige un bug, antes de escribir código de producción.
usado_por: implementador, tester
fuente: adaptado de mattpocock/skills (MIT), skill engineering/tdd, y de superpowers (MIT), skill test-driven-development
---

# TDD

Escribí la prueba primero, mirala fallar por la razón correcta, y después escribí el mínimo código para que pase.

**Principio:** si no viste fallar la prueba, no sabés si prueba lo correcto.

## La ley

```
NO HAY CÓDIGO DE PRODUCCIÓN SIN UNA PRUEBA QUE FALLÓ PRIMERO
```

Si escribiste código antes que la prueba, no lo uses como referencia. Empezá de nuevo desde la prueba.

## Seams: dónde van las pruebas

Un **seam** es el borde público donde observás el comportamiento sin mirar adentro. Las pruebas viven en los seams, no en los internos.

- Antes de escribir pruebas, identificá los seams de tu tarea. Si la tarea o la spec no los nombran, escribilos en tu reporte como supuesto.
- Probá el comportamiento a través de la interfaz pública. No mockees colaboradores internos tuyos; mockeá solo límites del sistema (red, reloj, base de datos externa).
- Una prueba que se rompe al refactorizar sin cambiar el comportamiento está mal ubicada.

## El ciclo

1. **Rojo:** escribí una prueba para un solo comportamiento, con un nombre que lo describa.
2. **Verificar rojo:** corré la prueba y mirá la falla. Debe fallar porque falta el comportamiento, no por un error de compilación o de setup. Si falla por otra razón, corregí la prueba antes de seguir.
3. **Verde:** escribí el mínimo código que hace pasar esa prueba. No anticipes pruebas futuras.
4. **Verificar verde:** corré la suite completa del área.
5. **Refactorizar** solo si todo está en verde, y sin cambiar comportamiento. Volvé a correr las pruebas.

## Cortes verticales, no horizontales

- **Correcto:** una prueba → una implementación → repetir. Cada prueba responde a lo que enseñó el ciclo anterior.
- **Incorrecto:** escribir todas las pruebas primero y después todo el código. Las pruebas en bloque verifican comportamiento imaginado y se vuelven insensibles a cambios reales.

## Anti-patrones

- **Acoplada a la implementación:** verifica métodos privados o consulta la base por fuera de la interfaz.
- **Tautológica:** el valor esperado se recalcula igual que el código (`expect(suma(a, b)).toBe(a + b)`), así que nunca puede contradecirlo. El valor esperado sale de una fuente independiente: un literal verificado, un ejemplo trabajado o la spec.
- **Sin aserción:** la prueba ejecuta el código y no verifica nada.

## Pruebas de regresión

Para un bug, la prueba de regresión tiene que probar la falla antes del arreglo:

1. Escribí la prueba que reproduce el síntoma.
2. Verificá que falla.
3. Aplicá el arreglo y verificá que pasa.
4. Revertí el arreglo un momento y verificá que vuelve a fallar. Si no falla, la prueba no captura el bug.

## Rol tester

Si sos el tester, no hay código de producción que pasar a verde. Tu rojo es la prueba escrita desde la spec. En el reporte, marcá qué pruebas fallarían por falta de implementación y cuáles fallarían por un error de la prueba.
