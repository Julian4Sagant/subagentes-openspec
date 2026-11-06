#!/usr/bin/env node
'use strict';
// Valida la fuente canónica: roles (agents/), skills (skills/) y sus referencias cruzadas.
// Revisa frontmatter, formatos de reporte y ausencia de nombres de modelo o de host en el texto.
// Sale con 0 si todo está bien, con 1 si no.
// Uso: node scripts/validar-agentes.js [carpeta-de-roles] [carpeta-de-skills]

const path = require('path');
const { cargarRoles, cargarSkills, lista, ACCESOS, CAPACIDADES, CAMPOS } = require('./lib/canon');

const RAIZ = path.resolve(__dirname, '..');

// Nada de esto puede aparecer en el texto canónico: si aparece, el rol o la skill dejan de ser portables.
const PROHIBIDO = /\$CLAUDE_PROJECT_DIR|\.claude\/|\.opencode|\.gemini|\.codex|\.kimi|subagent_type|\bTask tool\b|\bSkill tool\b|\/opsx:|\b(claude|haiku|sonnet|opus|gpt|gemini|kimi|deepseek|codex|opencode)\b/gi;

const SECCIONES_ROL = ['## Rol', '## Procedimiento', '## Reglas', '## Reporte'];

function revisarTexto(rel, texto, problemas) {
	for (const m of new Set(texto.match(PROHIBIDO) || [])) {
		problemas.push(`${rel}: contiene "${m}", que ata el contenido a un modelo o a un host`);
	}
}

function revisarSkills(dirSkills, dirRoles, problemas) {
	const skills = cargarSkills(dirSkills);
	const roles = new Set(cargarRoles(dirRoles).map(r => r.meta && r.meta.name).filter(Boolean));
	for (const [nombre, s] of Object.entries(skills)) {
		const rel = `skills/${nombre}/SKILL.md`;
		if (!s.meta) {
			problemas.push(`${rel}: falta el frontmatter`);
			continue;
		}
		if (s.meta.name !== nombre) {
			problemas.push(`${rel}: name "${s.meta.name}" no coincide con la carpeta`);
		}
		if (!s.meta.description || s.meta.description.length < 40) {
			problemas.push(`${rel}: falta description (o es muy corta)`);
		}
		if (!s.meta.fuente) {
			problemas.push(`${rel}: falta fuente (las skills adaptadas de otros repos citan su origen)`);
		}
		const usadoPor = lista(s.meta.usado_por);
		if (usadoPor.length === 0) {
			problemas.push(`${rel}: falta usado_por`);
		}
		for (const r of usadoPor) {
			if (!roles.has(r) && r !== 'orquestador') {
				problemas.push(`${rel}: usado_por nombra "${r}", que no es un rol`);
			}
		}
		if (!/^# /m.test(s.cuerpo)) {
			problemas.push(`${rel}: falta un título (# ...)`);
		}
		revisarTexto(rel, `${s.meta.description}\n${s.cuerpo}`, problemas);
	}
	return skills;
}

/** Devuelve la lista de problemas. Lista vacía = todo bien. */
function validar(dir, dirSkills = path.join(RAIZ, 'skills')) {
	const problemas = [];
	const roles = cargarRoles(dir);
	if (roles.length === 0) {
		problemas.push(`${dir}: no hay roles .md`);
	}
	const skills = revisarSkills(dirSkills, dir, problemas);
	const nombres = new Set();

	for (const rol of roles) {
		const rel = rol.archivo;
		if (!rol.meta) {
			problemas.push(`${rel}: falta el frontmatter (bloque entre dos líneas ---)`);
			continue;
		}
		for (const campo of CAMPOS) {
			if (!rol.meta[campo]) {
				problemas.push(`${rel}: falta el campo "${campo}"`);
			}
		}
		const base = path.basename(rel, '.md');
		if (rol.meta.name && rol.meta.name !== base) {
			problemas.push(`${rel}: name "${rol.meta.name}" no coincide con el nombre del archivo`);
		}
		if (nombres.has(rol.meta.name)) {
			problemas.push(`${rel}: name "${rol.meta.name}" repetido`);
		}
		nombres.add(rol.meta.name);
		if (rol.meta.name && !/^[a-z][a-z0-9-]*$/.test(rol.meta.name)) {
			problemas.push(`${rel}: name debe ser minúsculas, números y guiones`);
		}
		if (rol.meta.acceso && !ACCESOS.includes(rol.meta.acceso)) {
			problemas.push(`${rel}: acceso "${rol.meta.acceso}" debe ser lectura o escritura`);
		}
		if (rol.meta.capacidad && !CAPACIDADES.includes(rol.meta.capacidad)) {
			problemas.push(`${rel}: capacidad "${rol.meta.capacidad}" debe ser baja, media o alta`);
		}
		if (rol.meta.description && rol.meta.description.length < 40) {
			problemas.push(`${rel}: description muy corta; es lo que usa el host para decidir cuándo delegar`);
		}
		for (const seccion of SECCIONES_ROL) {
			if (!rol.cuerpo.includes(seccion)) {
				problemas.push(`${rel}: falta la sección "${seccion}"`);
			}
		}
		if (rol.meta.name === 'revisor' && !rol.cuerpo.includes('VEREDICTO: APROBADO')) {
			problemas.push(`${rel}: el revisor debe declarar el formato de VEREDICTO`);
		}
		for (const s of lista(rol.meta.skills)) {
			if (!skills[s]) {
				problemas.push(`${rel}: la skill "${s}" no existe en skills/`);
			} else if (!lista(skills[s].meta && skills[s].meta.usado_por).includes(rol.meta.name)) {
				problemas.push(`${rel}: la skill "${s}" no lista a "${rol.meta.name}" en usado_por`);
			}
		}
		revisarTexto(rel, `${rol.meta.description}\n${rol.cuerpo}`, problemas);
	}
	return problemas;
}

if (require.main === module) {
	const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(RAIZ, 'agents');
	const dirSkills = process.argv[3] ? path.resolve(process.argv[3]) : path.join(RAIZ, 'skills');
	const problemas = validar(dir, dirSkills);
	if (problemas.length) {
		console.error(problemas.map(p => `- ${p}`).join('\n'));
		process.exit(1);
	}
	console.log(`OK: ${cargarRoles(dir).length} roles y ${Object.keys(cargarSkills(dirSkills)).length} skills válidos`);
}

module.exports = { validar };
