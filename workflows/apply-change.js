// Workflow del apply de un change de OpenSpec: los agentes del repo en el orden del grafo.
// Se instala en .claude/workflows/ del proyecto. Se lanza solo cuando la persona lo pide explícitamente
// (la herramienta Workflow no se dispara sola).
//
// Supone que los worktrees de cada área ya existen (args.areas[].worktree) y que la corrección corre
// sobre el checkout integrado, después de que el orquestador mergea las áreas.

export const meta = {
  name: 'apply-change',
  description: 'Apply de un change de OpenSpec: tester e implementadores en paralelo, join, revisión y hasta 3 vueltas de corrección',
  whenToUse: 'Cuando un change de OpenSpec está aprobado y sus tareas ya están asignadas por área',
  phases: [{ title: 'Implementar' }, { title: 'Join' }, { title: 'Revisar' }, { title: 'Corregir' }],
}

const MAX_VUELTAS = 3
const VEREDICTO = /^VEREDICTO:\s*(APROBADO|CAMBIOS REQUERIDOS|SIN HALLAZGOS|CON HALLAZGOS)/m
const CONTEOS = /CRITICAL:\s*(\d+)\s+WARNING:\s*(\d+)/
const PUNTO = /^\d+\.\s*\[(código|tests|artefactos)\].*$/gm

if (!args || !args.change || !Array.isArray(args.areas) || args.areas.length === 0) {
  throw new Error('args necesita change y areas (cada una con nombre, tareas y worktree)')
}
const { change, areas } = args
const postgres = Boolean(args.postgres)
const seguridad = Boolean(args.seguridad)

phase('Implementar')
const grupo = await parallel([
  () => agent(`Usá el agente tester para el change "${change}". Escribí los tests de los Scenarios desde la spec, sin leer src/main. Reportá con tu formato fijo.`, { label: 'tester', phase: 'Implementar' }),
  ...areas.map(a => () => agent(`Usá el agente implementador para el change "${change}", área "${a.nombre}", tareas ${a.tareas}, en el worktree ${a.worktree}. Reportá con tu formato fijo.`, { label: `impl:${a.nombre}`, phase: 'Implementar' })),
  ...(postgres ? [() => agent(`Usá el agente postgres-pro para el change "${change}": migraciones y consultas de su área. Reportá con tu formato fijo.`, { label: 'postgres-pro', phase: 'Implementar' })] : []),
])
if (grupo.includes(null)) {
  return { estado: 'BLOQUEADO', motivo: 'un agente del grupo falló o fue saltado en Implementar' }
}

const historial = []
for (let vuelta = 1; vuelta <= MAX_VUELTAS; vuelta++) {
  phase('Join')
  const compilacion = await agent(`Compilá y corré ./mvnw -B -q test en el checkout integrado del change "${change}". Reportá el comando, la cantidad de tests y los fallos. No corrijas nada.`, { label: `join:${vuelta}`, phase: 'Join' })
  if (compilacion === null) {
    return { estado: 'BLOQUEADO', motivo: 'falló la compilación del join', historial }
  }

  phase('Revisar')
  const pasadas = [
    () => agent(`Usá el agente revisor para el change "${change}", sobre el checkout integrado. Corré openspec validate --strict. Resultado de la compilación: ${compilacion}. Terminá con la línea VEREDICTO exacta.`, { label: `revisor:${vuelta}`, phase: 'Revisar' }),
  ]
  if (seguridad) {
    pasadas.push(() => agent(`Usá el agente security-auditor para el change "${change}", sobre el checkout integrado. Terminá con la línea VEREDICTO y la línea CRITICAL/WARNING exactas.`, { label: `security:${vuelta}`, phase: 'Revisar' }))
  }
  const [revision, auditoria = null] = await parallel(pasadas)
  if (revision === null || (seguridad && auditoria === null)) {
    return { estado: 'BLOQUEADO', motivo: 'falló el revisor o el auditor de seguridad', historial }
  }

  const veredictoRevisor = VEREDICTO.exec(revision)?.[1] ?? null
  if (veredictoRevisor === null) {
    return { estado: 'BLOQUEADO', motivo: 'el revisor no dejó la línea VEREDICTO', revision, historial }
  }
  const conteo = auditoria ? CONTEOS.exec(auditoria) : null
  if (seguridad && conteo === null) {
    return { estado: 'BLOQUEADO', motivo: 'el auditor no dejó la línea CRITICAL/WARNING', auditoria, historial }
  }
  const seguridadOk = !seguridad || (Number(conteo[1]) === 0 && Number(conteo[2]) === 0)

  historial.push({
    vuelta,
    revisor: veredictoRevisor,
    seguridad: conteo ? `CRITICAL ${conteo[1]} WARNING ${conteo[2]}` : null,
  })
  if (veredictoRevisor === 'APROBADO' && seguridadOk) {
    return { estado: 'APROBADO', vuelta, historial }
  }
  if (vuelta === MAX_VUELTAS) {
    return { estado: 'ESCALA_A_PERSONA', motivo: 'tres vueltas sin aprobar', revision, auditoria, historial }
  }

  phase('Corregir')
  const puntos = revision.match(PUNTO) ?? []
  const artefactos = puntos.filter(p => p.includes('[artefactos]'))
  if (artefactos.length > 0) {
    return { estado: 'ESCALA_A_PERSONA', motivo: 'hay cambios en artefactos; los decide la persona con /opsx:update', puntos: artefactos, historial }
  }
  const codigo = puntos.filter(p => p.includes('[código]'))
  const tests = puntos.filter(p => p.includes('[tests]'))
  if (codigo.length > 0 || !seguridadOk) {
    await agent(`Usá el agente implementador para el change "${change}". Corregí solo estos hallazgos de código, sin tocar artefactos ni tests:\n${codigo.join('\n') || '(ninguno del revisor)'}\n\nAuditoría de seguridad (corregí los CRITICAL y WARNING):\n${seguridadOk ? 'sin hallazgos' : auditoria}`, { label: `corregir:codigo:${vuelta}`, phase: 'Corregir' })
  }
  if (tests.length > 0) {
    await agent(`Usá el agente tester para el change "${change}". Corregí solo estos hallazgos de tests, siguiendo la spec:\n${tests.join('\n')}`, { label: `corregir:tests:${vuelta}`, phase: 'Corregir' })
  }
}
