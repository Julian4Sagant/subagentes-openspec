// Pruebas de los scripts que usa la revisión en CI (.github/workflows/revision.yml).
// Uso: node --test scripts/test-revision-ci.js

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { analizar, changesTocados } = require('./analizar-pr');
const { leerVeredicto } = require('./leer-veredicto');

const soloRevisor = [{ agente: 'revisor', modo: 'revisor' }];
const conSeguridad = [...soloRevisor, { agente: 'security-auditor', modo: 'seguridad' }];

test('detecta el change por los archivos de openspec/changes', () => {
	const archivos = ['openspec/changes/alta-usuario/tasks.md', 'src/main/java/App.java'];
	assert.deepStrictEqual(analizar({ archivos }), { change: 'alta-usuario', agentes: soloRevisor });
});

test('no cuenta los changes archivados', () => {
	assert.deepStrictEqual(changesTocados(['openspec/changes/archive/2026-01-01-viejo/tasks.md']), []);
});

test('sin change no corre ningún agente', () => {
	assert.deepStrictEqual(analizar({ archivos: ['README.md'] }), { change: '', agentes: [] });
});

test('varios changes en un PR es un error si no se pasa change', () => {
	const archivos = ['openspec/changes/a/tasks.md', 'openspec/changes/b/tasks.md'];
	assert.throws(() => analizar({ archivos }), /varios changes \(a, b\)/);
	assert.strictEqual(analizar({ archivos, change: 'b' }).change, 'b');
});

test('rechaza un nombre de change que no es válido', () => {
	assert.throws(() => analizar({ archivos: [], change: 'x"; rm -rf /' }), /no es un nombre de change válido/);
});

test('en modo auto el security-auditor corre si una ruta toca autenticación o permisos', () => {
	const base = ['openspec/changes/login/tasks.md'];
	assert.deepStrictEqual(analizar({ archivos: base }).agentes, conSeguridad);
	const sinSeguridad = ['openspec/changes/listado/tasks.md', 'src/main/java/Listado.java'];
	assert.deepStrictEqual(analizar({ archivos: sinSeguridad }).agentes, soloRevisor);
	const conAuth = [...sinSeguridad, 'src/main/java/auth/Filtro.java'];
	assert.deepStrictEqual(analizar({ archivos: conAuth }).agentes, conSeguridad);
});

test('seguridad siempre, nunca y patrón propio', () => {
	const archivos = ['openspec/changes/listado/tasks.md', 'src/main/java/auth/Filtro.java'];
	assert.deepStrictEqual(analizar({ archivos, seguridad: 'siempre' }).agentes, conSeguridad);
	assert.deepStrictEqual(analizar({ archivos, seguridad: 'nunca' }).agentes, soloRevisor);
	assert.deepStrictEqual(analizar({ archivos, patron: 'acceso' }).agentes, soloRevisor);
	assert.throws(() => analizar({ archivos, seguridad: 'a veces' }), /auto, siempre o nunca/);
});

test('el CLI imprime las líneas para GITHUB_OUTPUT', () => {
	const r = spawnSync(process.execPath, [path.join(__dirname, 'analizar-pr.js')], {
		input: 'openspec/changes/alta-usuario/specs/x.md\n',
		encoding: 'utf8',
	});
	assert.strictEqual(r.status, 0, r.stderr);
	assert.strictEqual(r.stdout, `change=alta-usuario\nagentes=${JSON.stringify(soloRevisor)}\n`);
});

test('revisor: pasa solo con APROBADO', () => {
	assert.strictEqual(leerVeredicto('revisor', 'matriz...\n\nVEREDICTO: APROBADO\n').pasa, true);
	assert.strictEqual(leerVeredicto('revisor', '**VEREDICTO: APROBADO**').pasa, true);
	const cambios = leerVeredicto('revisor', 'VEREDICTO: CAMBIOS REQUERIDOS\n1. [código] A.java:3 — validar nulo\n');
	assert.strictEqual(cambios.pasa, false);
	assert.match(cambios.motivo, /1\. \[código\] A\.java:3/);
	assert.strictEqual(leerVeredicto('revisor', 'me quedé sin turnos').pasa, false);
});

test('revisor: vale la última línea VEREDICTO', () => {
	const reporte = 'El formato es:\nVEREDICTO: APROBADO\n\n...\nVEREDICTO: CAMBIOS REQUERIDOS\n1. [tests] T.java:9 — falta el THEN\n';
	assert.strictEqual(leerVeredicto('revisor', reporte).pasa, false);
});

test('seguridad: pasa solo sin CRITICAL ni WARNING', () => {
	assert.strictEqual(leerVeredicto('seguridad', 'VEREDICTO: SIN HALLAZGOS\nCRITICAL: 0  WARNING: 0  SUGGESTION: 2').pasa, true);
	assert.strictEqual(leerVeredicto('seguridad', 'VEREDICTO: CON HALLAZGOS\nCRITICAL: 0  WARNING: 1  SUGGESTION: 0').pasa, false);
	assert.strictEqual(leerVeredicto('seguridad', 'VEREDICTO: SIN HALLAZGOS').pasa, false);
});

test('el CLI de leer-veredicto sale con 0 o 1', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veredicto-'));
	const archivo = path.join(dir, 'reporte.md');
	const correr = () => spawnSync(process.execPath, [path.join(__dirname, 'leer-veredicto.js'), 'revisor', archivo], { encoding: 'utf8' });
	fs.writeFileSync(archivo, 'VEREDICTO: APROBADO\n');
	assert.strictEqual(correr().status, 0);
	fs.writeFileSync(archivo, 'VEREDICTO: CAMBIOS REQUERIDOS\n1. [código] A.java:1 — x\n');
	assert.strictEqual(correr().status, 1);
	fs.rmSync(dir, { recursive: true });
});
