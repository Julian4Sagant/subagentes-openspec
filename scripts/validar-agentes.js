#!/usr/bin/env node
// Valida el frontmatter de los agentes del repo, para que una edición no rompa la instalación
// ni deje a un agente de solo lectura con herramientas de escritura.
// Uso (desde la raíz del repo): node scripts/validar-agentes.js
// Sale con 0 si todo está bien y con 1 si hay problemas. Lista cada problema con su archivo.

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const carpetaAgentes = path.join(raiz, 'agents');
const carpetaHooks = path.join(raiz, 'hooks');

const MODELOS = ['haiku', 'sonnet', 'opus'];
const SOLO_LECTURA = ['revisor', 'security-auditor'];
const ESCRITURA = ['Write', 'Edit', 'NotebookEdit'];

/** Separa el frontmatter (entre dos líneas `---`) del cuerpo. Devuelve null si no hay frontmatter. */
function leerFrontmatter(texto) {
	const partes = texto.split(/^---\s*$/m);
	if (partes.length < 3 || partes[0].trim() !== '') {
		return null;
	}
	return partes[1];
}

/** Lee un campo de primer nivel con valor en la misma línea, por ejemplo `model: sonnet`. */
function campo(fm, nombre) {
	const m = new RegExp(`^${nombre}:[ \\t]*(.*)$`, 'm').exec(fm);
	return m ? m[1].trim() : null;
}

/** Lista las herramientas de `tools: A, B, C`. */
function herramientas(fm) {
	const valor = campo(fm, 'tools');
	return valor ? valor.split(',').map(h => h.trim()).filter(Boolean) : null;
}

/** Devuelve las rutas de `command:` de los hooks, por ejemplo `.claude/hooks/x.js`. */
function rutasDeHooks(fm) {
	const rutas = [];
	for (const m of fm.matchAll(/command:\s*node\s+"?\$CLAUDE_PROJECT_DIR\/(\.claude\/hooks\/[^"\s]+)"?/g)) {
		rutas.push(m[1]);
	}
	return rutas;
}

function validar() {
	const problemas = [];
	const archivos = fs.readdirSync(carpetaAgentes).filter(f => f.endsWith('.md'));
	if (archivos.length === 0) {
		problemas.push('agents/: no hay agentes');
	}

	for (const archivo of archivos) {
		const rel = `agents/${archivo}`;
		const texto = fs.readFileSync(path.join(carpetaAgentes, archivo), 'utf8');
		const fm = leerFrontmatter(texto);
		if (fm === null) {
			problemas.push(`${rel}: falta el frontmatter (bloque entre dos líneas ---)`);
			continue;
		}

		const nombre = campo(fm, 'name');
		const base = path.basename(archivo, '.md');
		if (nombre !== base) {
			problemas.push(`${rel}: name "${nombre}" no coincide con el nombre del archivo "${base}"`);
		}
		if (!campo(fm, 'description')) {
			problemas.push(`${rel}: falta description (es lo que usa Claude para elegir el agente)`);
		}

		const modelo = campo(fm, 'model');
		if (modelo && !MODELOS.includes(modelo)) {
			problemas.push(`${rel}: model "${modelo}" no es uno de ${MODELOS.join(', ')}`);
		}

		const tools = herramientas(fm);
		if (SOLO_LECTURA.includes(base) && tools) {
			const escritura = tools.filter(t => ESCRITURA.includes(t));
			if (escritura.length > 0) {
				problemas.push(`${rel}: agente de solo lectura con herramientas de escritura: ${escritura.join(', ')}`);
			}
		}
		if (SOLO_LECTURA.includes(base) && !fm.includes('sin-escritura.js')) {
			problemas.push(`${rel}: agente de solo lectura sin la guarda sin-escritura.js`);
		}

		for (const ruta of rutasDeHooks(fm)) {
			const archivoHook = path.join(carpetaHooks, path.basename(ruta));
			if (!fs.existsSync(archivoHook)) {
				problemas.push(`${rel}: el hook ${ruta} no existe en hooks/`);
			}
		}
	}
	return problemas;
}

const problemas = validar();
if (problemas.length > 0) {
	for (const p of problemas) {
		console.log(`PROBLEMA  ${p}`);
	}
	process.exit(1);
}
console.log('OK: los agentes tienen frontmatter válido y sus hooks existen');
