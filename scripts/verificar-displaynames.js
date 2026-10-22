#!/usr/bin/env node
// Verifica que cada Scenario de la spec tenga un test con @DisplayName igual, letra por letra.
// Uso: node verificar-displaynames.js <nombres.txt> [directorio-de-tests]
// nombres.txt tiene un nombre de Scenario por línea, copiado de `openspec show --deltas-only`.
// Sale con 0 si todos tienen test, 1 si falta alguno y 2 si el uso es incorrecto.

const fs = require('fs');
const path = require('path');

const [archivo, dir = 'src/test'] = process.argv.slice(2);
if (!archivo || !fs.existsSync(archivo) || !fs.existsSync(dir)) {
	console.error('Uso: node verificar-displaynames.js <nombres.txt> [src/test]');
	process.exit(2);
}

function recorrer(d) {
	return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
		const p = path.join(d, e.name);
		if (e.isDirectory()) {
			return recorrer(p);
		}
		return e.name.endsWith('.java') ? [p] : [];
	});
}

const nombres = fs.readFileSync(archivo, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const conTest = new Set();
for (const f of recorrer(dir)) {
	for (const m of fs.readFileSync(f, 'utf8').matchAll(/@DisplayName\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) {
		conTest.add(m[1].replace(/\\(.)/g, '$1'));
	}
}

const faltantes = nombres.filter(n => !conTest.has(n));
console.log(`Scenarios: ${nombres.length}  con test: ${nombres.length - faltantes.length}  sin test: ${faltantes.length}`);
for (const n of faltantes) {
	console.log(`SIN TEST: ${n}`);
}
process.exit(faltantes.length ? 1 : 0);
