'use strict';
// Lectura de los roles canónicos (agents/) y de las skills (skills/). Sin dependencias.

const fs = require('fs');
const path = require('path');

const ACCESOS = ['lectura', 'escritura'];
const CAPACIDADES = ['baja', 'media', 'alta'];
const CAMPOS = ['name', 'description', 'acceso', 'alcance', 'capacidad'];

/** Separa el frontmatter (entre dos líneas `---`) del cuerpo. Devuelve null si no hay frontmatter. */
function parsear(texto) {
	const t = texto.replace(/\r\n/g, '\n');
	const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(t);
	if (!m) {
		return null;
	}
	const meta = {};
	for (const linea of m[1].split('\n')) {
		const k = /^([a-z_]+):\s*(.*)$/.exec(linea);
		if (k) {
			meta[k[1]] = k[2].trim();
		}
	}
	return { meta, cuerpo: m[2].replace(/^\n+/, '').replace(/\s*$/, '\n') };
}

/** Lista separada por comas del frontmatter, por ejemplo `skills: a, b`. Vacía si no existe. */
function lista(valor) {
	return valor ? valor.split(',').map(s => s.trim()).filter(Boolean) : [];
}

/** Carga todos los roles de una carpeta, ordenados por nombre de archivo. */
function cargarRoles(dir) {
	return fs.readdirSync(dir)
		.filter(f => f.endsWith('.md'))
		.sort()
		.map(archivo => {
			const texto = fs.readFileSync(path.join(dir, archivo), 'utf8');
			return { archivo, ...(parsear(texto) || { meta: null, cuerpo: '' }) };
		});
}

/** Carga las skills: cada una es una carpeta con SKILL.md. Devuelve un mapa nombre → skill. */
function cargarSkills(dir) {
	const mapa = {};
	if (!fs.existsSync(dir)) {
		return mapa;
	}
	for (const carpeta of fs.readdirSync(dir).sort()) {
		const archivo = path.join(dir, carpeta, 'SKILL.md');
		if (!fs.existsSync(archivo)) {
			continue;
		}
		const parseada = parsear(fs.readFileSync(archivo, 'utf8'));
		mapa[carpeta] = { carpeta, meta: parseada ? parseada.meta : null, cuerpo: parseada ? parseada.cuerpo : '' };
	}
	return mapa;
}

module.exports = { parsear, lista, cargarRoles, cargarSkills, ACCESOS, CAPACIDADES, CAMPOS };
