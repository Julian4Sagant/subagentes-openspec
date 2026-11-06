# Revisión en CI

El revisor y el security-auditor pueden correr en GitHub Actions en cada PR del proyecto. Si el veredicto no pasa, el check queda en rojo. Los tests del proyecto corren antes, en un job común, sin Claude.

No reemplaza al apply con una persona. El tester y el implementador escriben código y necesitan worktrees, y commitear es del orquestador; eso sigue en la sesión. La revisión en CI es una segunda mirada sobre lo que ya se commiteó.

## Qué corre

`.github/workflows/revision.yml` es un workflow reutilizable. El proyecto lo llama desde su propio workflow, y corre cuatro jobs:

| Job | Qué hace | Usa Claude |
|---|---|---|
| `contrato` | `verificar-proyecto.js` sobre el proyecto: que estén `CLAUDE.md`, `openspec/config.yaml`, `docs/flujo-de-trabajo.md` y los agentes instalados idénticos a los de `ref-agentes`. | No |
| `tests` | El comando de tests del proyecto (`./mvnw -B test` por defecto). | No |
| `analizar` | `analizar-pr.js` sobre los archivos del PR: qué change revisar y si hace falta el security-auditor. | No |
| `agentes` | El revisor y, si corresponde, el security-auditor, en paralelo. `leer-veredicto.js` decide si el check pasa. | Sí |

`agentes` corre solo si `contrato` y `tests` pasaron o se saltaron, y si el PR toca un change. Si los tests fallan, no se gastan tokens.

### Qué change se revisa

Si no pasás el input `change`, se detecta por las carpetas que el PR toca en `openspec/changes/` (sin contar `archive/`):

- Ninguna: no corre ningún agente. Un PR que no toca un change no tiene contra qué spec revisarse.
- Una: ese change.
- Más de una: `analizar` falla y pide el input `change`.

### Cuándo corre el security-auditor

Con `seguridad: auto`, corre si alguna ruta del PR coincide con el patrón de `scripts/analizar-pr.js` (`auth`, `token`, `jwt`, `permis`, `password`, `secret`, `login`, `oauth`, `crypt`, `cors` y parecidos). Con `siempre` o `nunca` lo forzás. Si tu proyecto nombra esas carpetas de otra forma, pasá tu propia expresión en `patron-seguridad`.

### Cuándo pasa el check

Con las mismas líneas fijas que lee `workflows/apply-change.js`:

- Revisor: solo con `VEREDICTO: APROBADO`. Con `CAMBIOS REQUERIDOS`, el check falla y muestra los puntos numerados.
- Security-auditor: solo con `CRITICAL: 0  WARNING: 0`.
- Si el reporte no tiene la línea fija, el check falla. Un reporte sin veredicto no es una aprobación.

El reporte completo de cada agente queda en el resumen del run y como artifact (`reporte-revisor`, `reporte-security-auditor`).

## Cómo se adapta el revisor a CI

En el apply, el revisor revisa código integrado sin commitear. En un PR el código ya está commiteado, así que el prompt le pasa ese contexto: el cambio es `git diff origin/<base>...HEAD`, los tests ya pasaron en el job anterior y los archivos temporales van en `$RUNNER_TEMP`. El archivo del agente no cambia.

## Instalar en un proyecto

1. El proyecto tiene que cumplir el contrato ([Patrones](07-patrones.md#2-el-contrato-de-un-proyecto)) y tener **commiteados** `.claude/agents/`, `.claude/hooks/`, `.claude/scripts/` y `.claude/skills/`, incluidas las de OpenSpec (`openspec-verify-change`). El runner solo ve lo que está en el repo.
2. Agregá el secreto `ANTHROPIC_API_KEY` en el proyecto (Settings → Secrets and variables → Actions).
3. Copiá [`ejemplos/revision-pr.yml`](ejemplos/revision-pr.yml) a `.github/workflows/` del proyecto y ajustá los inputs.
4. Si este repo es privado, GitHub tiene que permitir que otros repos usen sus workflows: en este repo, Settings → Actions → General → Access, "Accessible from repositories owned by…". Además, el proyecto necesita el secreto `TOKEN_AGENTES`, con un token que pueda leer este repo, porque los jobs lo descargan para correr los scripts.

### Inputs

| Input | Por defecto | Para qué |
|---|---|---|
| `change` | detectado | Nombre del change a revisar. |
| `comando-test` | `./mvnw -B test` | Tests del proyecto. Vacío = sin job `tests`. |
| `java-version` | `21` | Java que instala `setup-java`. Vacío = no instala Java. |
| `seguridad` | `auto` | `auto`, `siempre` o `nunca`. |
| `patron-seguridad` | el del script | Expresión regular sobre las rutas del PR. |
| `rama-base` | base del PR | Rama contra la que se compara. Hace falta si no corrés en `pull_request`. |
| `ref-agentes` | `main` | Versión de este repo para el contrato y los scripts. Usá la misma que en el `uses`. |
| `verificar-contrato` | `true` | Corre el job `contrato`. |
| `version-claude` | `latest` | Versión de `@anthropic-ai/claude-code`. Fijala para que un cambio de la CLI no rompa el pipeline. |
| `version-openspec` | `latest` | Versión de `@fission-ai/openspec`. |
| `herramientas-extra` | vacío | Reglas de permiso extra, separadas por coma, por ejemplo `Bash(./gradlew:*)`. |

### Otros stacks

Los inputs ya permiten otro comando de tests y saltar Java. Si el proyecto no usa Maven, agregá su comando en `herramientas-extra` para que el revisor pueda correr tests puntuales.

## Permisos y seguridad

- Claude Code corre con `-p`, sin nadie que apruebe. Solo puede usar lo que lista el paso: delegar en el agente, leer, y algunos comandos de lectura (`git diff`, `openspec`, el verificador de `@DisplayName`, `./mvnw`). Todo lo demás se deniega.
- Las guardas de los agentes siguen activas: `sin-escritura.js --solo-lectura` corre con `$CLAUDE_PROJECT_DIR` apuntando al checkout.
- El workflow pide solo `contents: read`, y los checkouts no dejan el token en disco.
- **No corre en PRs desde forks.** GitHub no les pasa secretos, y el texto de un PR ajeno puede intentar redirigir al agente. No lo cambies a `pull_request_target`.
- La API key está en el entorno del job. Un PR de alguien con permiso de push puede correr código propio con `./mvnw` igual que en cualquier CI. Tratá la revisión con agentes con el mismo nivel de confianza que tus otros jobs.

## Costo

Cada run del job `agentes` gasta tokens: el revisor usa sonnet y el security-auditor opus. Para acotarlo:

- El ejemplo salta los PRs en borrador y cancela la revisión anterior cuando llega un push nuevo.
- Si querés revisar solo a pedido, cambiá el disparador por una etiqueta (`types: [labeled]` y `if: github.event.label.name == 'revisar'`).
- `seguridad: nunca` deja al security-auditor para cuando lo lanzás a mano.

## Probar los scripts

Desde este repo:

```bash
node --test scripts/test-revision-ci.js
```

`analizar-pr.js` y `leer-veredicto.js` también se pueden correr a mano:

```bash
git diff --name-only origin/main...HEAD | node scripts/analizar-pr.js
```

```bash
node scripts/leer-veredicto.js revisor reporte.md
```
