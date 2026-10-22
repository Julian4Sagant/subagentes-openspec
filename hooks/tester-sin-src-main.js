#!/usr/bin/env node
// Bloquea al subagente "tester" el acceso al código de producción (src/main), para que escriba
// los tests solo a partir de la spec. Hook PreToolUse para Read, Grep, Glob y Bash.
//
// Se activa si la llamada viene del tester (campo agent_type del input del hook) o si se lo
// invoca con --siempre (desde el frontmatter del agente, donde solo corre mientras trabaja el
// tester). Cualquier otra llamada pasa sin cambios.

const fs = require('fs');
const path = require('path');

function leerEntrada() {
	try {
		return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
	}
	catch {
		return {};
	}
}

function normalizar(ruta) {
	return String(ruta || '').replace(/\\/g, '/').toLowerCase();
}

function tocaSrcMain(texto) {
	return /(^|[\/\s'"=])src\/main(\/|$|[\s'"])/.test(normalizar(texto));
}

/** Un directorio de búsqueda que contiene src/main (la raíz de un checkout, o src/) lo expone. */
function incluyeSrcMain(dir, cwd) {
	const base = path.resolve(cwd || process.cwd(), dir || '.');
	if (tocaSrcMain(base + '/')) {
		return true;
	}
	return fs.existsSync(path.join(base, 'src', 'main')) || (path.basename(base) === 'src' && fs.existsSync(path.join(base, 'main')));
}

function motivoDeBloqueo(entrada) {
	const herramienta = entrada.tool_name;
	const input = entrada.tool_input || {};
	const cwd = entrada.cwd;
	switch (herramienta) {
		case 'Read':
			return tocaSrcMain(input.file_path) ? 'leer código de producción (src/main)' : null;
		case 'Grep':
		case 'Glob':
			if (tocaSrcMain(input.pattern) || tocaSrcMain(input.glob)) {
				return 'buscar en src/main';
			}
			if (!input.path) {
				return 'buscar sin path: la búsqueda parte de la raíz e incluye src/main; pasá un path dentro de src/test';
			}
			return incluyeSrcMain(input.path, cwd) ? 'buscar en un directorio que contiene src/main' : null;
		case 'Bash':
			return tocaSrcMain(input.command) ? 'un comando que nombra src/main' : null;
		default:
			return null;
	}
}

const entrada = leerEntrada();
const esTester = process.argv.includes('--siempre') || entrada.agent_type === 'tester';
const motivo = esTester ? motivoDeBloqueo(entrada) : null;
if (motivo) {
	process.stdout.write(JSON.stringify({
		hookSpecificOutput: {
			hookEventName: 'PreToolUse',
			permissionDecision: 'deny',
			permissionDecisionReason: `El tester escribe los tests desde la spec, sin ver la implementación: no puede ${motivo}. Tomá un supuesto y reportalo.`,
		},
	}));
}
process.exit(0);
