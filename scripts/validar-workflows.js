#!/usr/bin/env node
// Revisa que cada workflow de workflows/ parsee y declare su meta.
// Uso (desde la raíz del repo): node scripts/validar-workflows.js
// No los ejecuta: lanzarían agentes de verdad. Solo valida sintaxis y meta.

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const carpeta = path.join(raiz, 'workflows');

const problemas = [];
const archivos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter(f => f.endsWith('.js')) : [];
if (archivos.length === 0) {
	problemas.push('workflows/: no hay workflows');
}

for (const archivo of archivos) {
	const rel = `workflows/${archivo}`;
	// Los fines de línea varían entre Windows y Linux: normalizar antes de buscar.
	const texto = fs.readFileSync(path.join(carpeta, archivo), 'utf8').replace(/\r\n/g, '\n');

	const meta = /^export\s+const\s+meta\s*=\s*\{/m.test(texto);
	if (!meta) {
		problemas.push(`${rel}: falta "export const meta = {...}" al principio`);
	}
	for (const campo of ['name', 'description']) {
		if (!new RegExp(`^\\s+${campo}:`, 'm').test(texto)) {
			problemas.push(`${rel}: meta sin campo ${campo}`);
		}
	}

	// El script corre como cuerpo de una función async, no como módulo: sacar el export.
	const cuerpo = texto.replace(/^export\s+const\s+meta\s*=/m, 'const meta =');
	try {
		new Function('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'budget', 'workflow', `return (async () => {${cuerpo}})();`);
	}
	catch (e) {
		problemas.push(`${rel}: no parsea: ${e.message}`);
	}
}

if (problemas.length > 0) {
	for (const p of problemas) {
		console.log(`PROBLEMA  ${p}`);
	}
	process.exit(1);
}
console.log(`OK: ${archivos.length} workflow(s) parsean y declaran su meta`);
