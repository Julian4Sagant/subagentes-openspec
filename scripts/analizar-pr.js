#!/usr/bin/env node
// Decide qué agentes corren en la revisión de un PR (.github/workflows/revision.yml), a partir de los
// archivos que cambió el PR.
//
// Uso: git diff --name-only origin/main...HEAD | node scripts/analizar-pr.js [--change <nombre>] [--seguridad auto|siempre|nunca] [--patron <regex>]
//
// Imprime dos líneas clave=valor para $GITHUB_OUTPUT:
//   change=<nombre del change, o vacío si el PR no toca ninguno>
//   agentes=<JSON con los agentes a correr, cada uno con agente y modo para leer-veredicto.js>
// Sale con 0 si pudo decidir, 1 si el PR es ambiguo o el nombre del change no es válido, y 2 si el uso es incorrecto.

const fs = require('fs');

/** Rutas que, en modo auto, piden al security-auditor: autenticación, tokens, permisos, secretos. */
const PATRON_SEGURIDAD = '(auth|secur|segur|token|jwt|permis|password|contrase|secret|login|oauth|crypt|cors)';

/** Un nombre de change de OpenSpec: minúsculas, números y guiones. Evita inyectar texto en el prompt. */
const NOMBRE_CHANGE = /^[a-z0-9][a-z0-9._-]*$/;

/** Los changes que tocan los archivos: carpetas de openspec/changes/, sin contar archive/. */
function changesTocados(archivos) {
	const nombres = new Set();
	for (const archivo of archivos) {
		const partes = archivo.replace(/\\/g, '/').split('/');
		if (partes[0] === 'openspec' && partes[1] === 'changes' && partes.length > 3 && partes[2] !== 'archive') {
			nombres.add(partes[2]);
		}
	}
	return [...nombres].sort();
}

/** Devuelve { change, agentes }. Lanza un Error si el PR es ambiguo o el nombre no es válido. */
function analizar({ archivos, change = '', seguridad = 'auto', patron = '' }) {
	if (!['auto', 'siempre', 'nunca'].includes(seguridad)) {
		throw new Error(`seguridad tiene que ser auto, siempre o nunca, no "${seguridad}"`);
	}

	let elegido = change.trim();
	if (!elegido) {
		const tocados = changesTocados(archivos);
		if (tocados.length > 1) {
			throw new Error(`el PR toca varios changes (${tocados.join(', ')}): pasá el input change con el que hay que revisar`);
		}
		elegido = tocados[0] ?? '';
	}
	if (!elegido) {
		return { change: '', agentes: [] };
	}
	if (!NOMBRE_CHANGE.test(elegido)) {
		throw new Error(`"${elegido}" no es un nombre de change válido`);
	}

	const agentes = [{ agente: 'revisor', modo: 'revisor' }];
	const regex = new RegExp(patron || PATRON_SEGURIDAD, 'i');
	if (seguridad === 'siempre' || (seguridad === 'auto' && archivos.some(a => regex.test(a)))) {
		agentes.push({ agente: 'security-auditor', modo: 'seguridad' });
	}
	return { change: elegido, agentes };
}

/** Lee --clave valor de la línea de comandos. */
function leerOpciones(argv) {
	const opciones = {};
	for (let i = 0; i < argv.length; i += 2) {
		const clave = argv[i];
		if (!['--change', '--seguridad', '--patron'].includes(clave) || i + 1 >= argv.length) {
			return null;
		}
		opciones[clave.slice(2)] = argv[i + 1];
	}
	return opciones;
}

if (require.main === module) {
	const opciones = leerOpciones(process.argv.slice(2));
	if (opciones === null) {
		console.error('Uso: git diff --name-only <base>...HEAD | node scripts/analizar-pr.js [--change <nombre>] [--seguridad auto|siempre|nunca] [--patron <regex>]');
		process.exit(2);
	}
	const archivos = fs.readFileSync(0, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
	try {
		const { change, agentes } = analizar({ archivos, ...opciones });
		console.log(`change=${change}`);
		console.log(`agentes=${JSON.stringify(agentes)}`);
	}
	catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

module.exports = { analizar, changesTocados, PATRON_SEGURIDAD };
