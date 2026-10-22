# Subagentes OpenSpec

Cinco subagentes de Claude Code para trabajar changes de OpenSpec en equipo, con roles de implementación, tests, revisión, seguridad y base de datos.

| Subagente | Rol | Modo |
|---|---|---|
| `implementador` | Implementa las tareas de un change aprobado en su propio worktree, acotado a su área de código. | Escritura |
| `tester` | Escribe los tests de los Scenarios a partir de la spec, sin ver la implementación. | Escritura |
| `revisor` | Revisa el código integrado contra la spec y el design, y valida el change con la CLI de OpenSpec. | Solo lectura |
| `security-auditor` | Audita cambios que tocan autenticación, tokens, permisos, errores o secretos. | Solo lectura |
| `postgres-pro` | Revisa y diseña migraciones, constraints y consultas de PostgreSQL. | Escritura |

## Instalación

Para usarlos en todos tus proyectos, copia los archivos a tu carpeta de usuario:

```bash
mkdir -p ~/.claude/agents && cp agents/*.md ~/.claude/agents/
```

Para usarlos solo en un proyecto, cópialos a `.claude/agents/` dentro del repo:

```bash
mkdir -p .claude/agents && cp agents/*.md .claude/agents/
```

Claude Code los carga al iniciar una sesión nueva. Cada archivo tiene su frontmatter (`name`, `description`, `tools`) y las instrucciones del rol.

## Requisitos

- Claude Code.
- La CLI de [OpenSpec](https://github.com/Fission-AI/OpenSpec) para `tester` y `revisor`.
- Los agentes asumen un flujo con changes de OpenSpec. Si tu proyecto usa otro stack, ajusta las secciones de proyecto dentro de cada archivo.

## Notas

- Los agentes de solo lectura (`revisor`, `security-auditor`) no modifican código.
- Ninguno de los archivos contiene claves, tokens ni datos reales.
