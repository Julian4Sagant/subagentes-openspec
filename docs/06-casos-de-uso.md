# Casos de uso

Basados en el trabajo real sobre un servicio HTTP de evaluación de solicitudes con PostgreSQL (Java, Spring Boot, Maven). Los nombres de clases, rutas y reglas de negocio son ilustrativos.

---

## 1. Endpoint nuevo con validaciones en dos áreas

**Contexto:** el grupo agrega `POST /solicitudes` con validaciones. Hay tareas en el controller (rutas, errores HTTP) y en el servicio (reglas de validación). La spec tiene 6 Scenarios.

**Agentes:** 2 implementadores (controller y servicio), tester y revisor.

**Por qué el grafo:** dos áreas que no se pisan pueden avanzar en paralelo, y con 6 Scenarios vale la pena que los tests salgan de la spec y no del código.

**Cómo se ve:**

1. El orquestador crea `.worktrees/controller`, `.worktrees/servicio` y `.worktrees/tester`.
2. Los tres trabajan a la vez. El tester escribe 6 tests con `@DisplayName` copiados de la spec y reporta como supuesto que la clase de request se llama `SolicitudRequest`, porque la spec no lo dice.
3. En el join compila todo, salvo un test: el tester asumió `SolicitudRequest` y el implementador la llamó `NuevaSolicitud`. Es un supuesto, no un error de contrato: el orquestador ajusta el import y sigue.
4. El revisor arma la matriz con los 6 Scenarios cubiertos y da `VEREDICTO: APROBADO`.

**Lección:** los supuestos del reporte del tester son la lista de cosas a mirar en el join.

---

## 2. Cambio que toca autenticación, errores y logs

**Contexto:** el grupo agrega una segunda clave de API para endpoints de administración y cambia el filtro de autenticación. También ajusta qué se loguea cuando la clave es inválida.

**Agentes:** implementador (seguridad), tester, revisor y **security-auditor**.

**Por qué el auditor:** el grupo toca autenticación y logs, dos de sus disparadores.

**Cómo se ve:** el revisor aprueba porque todos los Scenarios pasan. El auditor encuentra que, cuando la clave es inválida, el log incluye el valor recibido del header:

```
VEREDICTO: CON HALLAZGOS
CRITICAL: 1  WARNING: 0  SUGGESTION: 1
```

El CRITICAL vuelve al implementador con área `código`. En la segunda vuelta el log registra solo el motivo, y el auditor da `SIN HALLAZGOS`.

**Lección:** la spec no decía nada sobre qué no loguear, así que ningún test lo cubría. El especialista mira lo que la spec no cubre.

---

## 3. Tabla nueva de historial con listado paginado

**Contexto:** el grupo guarda cada evaluación en una tabla de historial y agrega un endpoint que lista las últimas, paginado.

**Agentes:** implementador (servicio y controller), tester, revisor y **postgres-pro**.

**Cómo se ve:** el postgres-pro crea la migración nueva con un `CHECK` para el estado y un índice por fecha. Detecta que el listado ordena solo por fecha, sin desempate: dos filas con la misma fecha pueden cambiar de página entre llamadas.

```
RESULTADO: CAMBIOS REQUERIDOS
CONSULTAS:
- listar historial → ORDER BY creado_en sin desempate; agregar id
```

El implementador agrega `id` al orden. El tester ya tenía un test de "el listado viene ordenado del más nuevo al más viejo", pero no uno de empate: el revisor lo marca como importante, área `tests`.

**Lección:** los problemas de paginación no fallan en un test con 3 filas; los ve alguien que mira el SQL.

---

## 4. Un test del tester contradice el código

**Contexto:** la spec dice que un monto negativo responde 400. El implementador respondió 422.

**Cómo se ve:** en el join el test del tester falla. El revisor lo clasifica:

```
VEREDICTO: CAMBIOS REQUERIDOS
1. [código] .../SolicitudController.java:41 — responde 422; la spec pide 400
```

Vuelve al implementador, que **no toca el test**: la spec manda. Si el implementador hubiera tenido una razón (por ejemplo, el design decía 422), el hallazgo habría sido `artefactos` y se resolvía con `/opsx:update`, con vos.

**Lección:** este es el caso para el que existe el grafo. Con un solo agente, el test se habría ajustado a 422 y la suite quedaba en verde.

---

## 5. Un `@DisplayName` mal copiado

**Contexto:** el Scenario se llama "Solicitud sin monto devuelve 400". El tester escribió "Solicitud sin monto devuelve un 400".

**Cómo se ve:** en el join, el orquestador corre:

```bash
node .claude/scripts/verificar-displaynames.js /tmp/nombres.txt src/test
```

```
Scenarios: 6  con test: 5  sin test: 1
SIN TEST: Solicitud sin monto devuelve 400
```

Vuelve al tester antes de lanzar al revisor, y el revisor no gasta una vuelta en esto.

**Lección:** lo que se puede verificar con un script no necesita un modelo.

---

## 6. Grupo chico de una sola área

**Contexto:** el grupo cambia dos textos de mensajes de error y agrega un campo opcional a una respuesta. Dos tareas, un archivo, dos Scenarios.

**Decisión:** **no usar el grafo.** La sesión principal hace el apply, escribe los dos tests y vos revisás el diff.

**Por qué:** cinco agentes leyendo la spec para dos tareas cuestan más de lo que aportan. La independencia del tester importa menos cuando el contrato es tan chico que lo revisás de un vistazo.

---

## 7. Verificación final antes del archive

**Contexto:** el change tiene 4 grupos, todos aprobados.

**Cómo se ve:** antes de `/opsx:archive`, pedís `/opsx:verify`. El revisor revisa el change completo con la skill `openspec-verify-change`: que todas las tareas estén cumplidas, que cada Scenario tenga test y que el código siga al design. Devuelve:

```
CRITICAL: 0  WARNING: 1  SUGGESTION: 2
...
VEREDICTO: APROBADO
```

El WARNING dice que una nota del design quedó desactualizada después de un `/opsx:update` del grupo 2. Lo corregís en el design y archivás.

**Lección:** cada grupo se revisa solo; la verificación final es la única mirada sobre el change entero.
