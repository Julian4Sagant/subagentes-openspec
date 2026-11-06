#!/usr/bin/env node
'use strict';
// Genera dist/ a partir de agents/ y skills/ (la única fuente). Un archivo por host y por rol, más un
// AGENTS.md con todos los roles y una carpeta de prompts planos para cualquier otro asistente.
// Las skills de cada rol van incluidas dentro del archivo: así no depende de que el host sepa cargarlas.
//
//   node scripts/generar-adaptadores.js           escribe dist/
//   node scripts/generar-adaptadores.js --check   sale con 1 si dist/ no coincide con la fuente (lo usa CI)

const fs = require('fs');
const path = require('path');
const { cargarRoles, cargarSkills, lista } = require('./lib/canon');
const { validar } = require('./validar-agentes');

const RAIZ = path.resolve(__dirname, '..');
const AGENTES = path.join(RAIZ, 'agents');
const SKILLS = path.join(RAIZ, 'skills');
const DIST = path.join(RAIZ, 'dist');
const CAPACIDAD = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config', 'capacidad.json'), 'utf8'));

// Herramientas por acceso. Los nombres de Gemini CLI y de OpenCode están sin verificar en la
// versión instalada: ver docs/02-hosts.md antes de confiar en ellos.
const CLAUDE_TOOLS = { lectura: 'Read, Grep, Glob, Bash', escritura: 'Read, Write, Edit, Bash, Grep, Glob' };
const GEMINI_TOOLS = {
	lectura: ['read_file', 'grep_search', 'glob', 'run_shell_command'],
	escritura: ['read_file', 'write_file', 'replace', 'grep_search', 'glob', 'run_shell_command'],
};

/** Valor YAML seguro: JSON.stringify produce una cadena entre comillas válida en YAML. */
const yaml = valor => JSON.stringify(valor);

/** Sube o baja los encabezados `n` niveles, sin pasar de h6. */
const desplazar = (cuerpo, n) => cuerpo.replace(/^(#{1,6}) /gm, (_, h) => '#'.repeat(Math.min(6, h.length + n)) + ' ');

/** Cuerpo del rol más las skills que declara, con sus encabezados bajados para no chocar con los del rol. */
function cuerpoCompleto(rol, skills) {
	const nombres = lista(rol.meta.skills);
	if (nombres.length === 0) {
		return rol.cuerpo;
	}
	const bloques = nombres.map(n => {
		const s = skills[n];
		return `### Skill: ${n}\n\n${desplazar(s.cuerpo, 2)}`;
	});
	return `${rol.cuerpo}\n## Skills del rol\n\n${bloques.join('\n')}`;
}

/** Modelo que corresponde a la capacidad del rol en un host, o null si el host no tiene mapeo. */
function modeloPara(host, capacidad) {
	const mapa = CAPACIDAD[host] || {};
	return mapa[capacidad] || null;
}

function salidas(roles, skills) {
	const archivos = new Map();
	const secciones = [];

	for (const rol of roles) {
		const { name, description, acceso, capacidad } = rol.meta;
		const lectura = acceso === 'lectura';
		const cuerpo = cuerpoCompleto(rol, skills);

		const modeloClaude = modeloPara('claude', capacidad);
		archivos.set(`claude/${name}.md`,
			`---\nname: ${name}\ndescription: ${yaml(description)}\ntools: ${CLAUDE_TOOLS[acceso]}\n` +
			`${modeloClaude ? `model: ${modeloClaude}\n` : ''}---\n\n${cuerpo}`);

		const modeloOpencode = modeloPara('opencode', capacidad);
		const opencodePermisos = lectura ? '\ntools:\n  write: false\n  edit: false' : '';
		archivos.set(`opencode/${name}.md`,
			`---\ndescription: ${yaml(description)}\nmode: subagent${opencodePermisos}` +
			`${modeloOpencode ? `\nmodel: ${modeloOpencode}` : ''}\n---\n\n${cuerpo}`);

		const modeloGemini = modeloPara('gemini', capacidad);
		const geminiTools = GEMINI_TOOLS[acceso].map(t => `  - ${t}`).join('\n');
		archivos.set(`gemini/${name}.md`,
			`---\nname: ${name}\ndescription: ${yaml(description)}\ntools:\n${geminiTools}` +
			`${modeloGemini ? `\nmodel: ${modeloGemini}` : ''}\n---\n\n${cuerpo}`);

		archivos.set(`prompts/${name}.md`,
			`<!-- Generado desde agents/${rol.archivo}. Pegalo como instrucciones del agente. -->\n\n${cuerpo}`);

		secciones.push(`## Agente: ${name}\n\n**Acceso:** ${acceso}. **Capacidad:** ${capacidad}. ${description}\n\n${desplazar(cuerpo, 1)}`);
	}

	archivos.set('AGENTS.md', [
		'# Agentes de OpenSpec (generado)',
		'',
		'Roles para el ciclo apply/verify de un change de OpenSpec. Cada uno es un subagente de solo',
		'lectura o de escritura según su acceso. El modelo lo elige quien usa el host, no este documento.',
		'',
		...secciones.map(s => s + '\n'),
	].join('\n'));

	return archivos;
}

function main(argv) {
	const problemas = validar(AGENTES, SKILLS);
	if (problemas.length) {
		console.error(problemas.map(p => `- ${p}`).join('\n'));
		return 1;
	}
	const esperado = salidas(cargarRoles(AGENTES), cargarSkills(SKILLS));

	if (argv.includes('--check')) {
		const desactualizados = [...esperado].filter(([rel, contenido]) => {
			const actual = fs.existsSync(path.join(DIST, rel)) ? fs.readFileSync(path.join(DIST, rel), 'utf8') : null;
			return actual !== contenido;
		}).map(([rel]) => rel);
		if (desactualizados.length) {
			console.error('dist/ no coincide con la fuente. Ejecutá node scripts/generar-adaptadores.js:');
			console.error(desactualizados.map(r => `- dist/${r}`).join('\n'));
			return 1;
		}
		console.log(`OK: dist/ al día (${esperado.size} archivos)`);
		return 0;
	}

	for (const [rel, contenido] of esperado) {
		const destino = path.join(DIST, rel);
		fs.mkdirSync(path.dirname(destino), { recursive: true });
		fs.writeFileSync(destino, contenido);
	}
	console.log(`Generados ${esperado.size} archivos en dist/`);
	return 0;
}

if (require.main === module) {
	process.exitCode = main(process.argv.slice(2));
}

module.exports = { salidas, modeloPara };
