'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validar } = require('../validar-agentes');

const RAIZ = path.resolve(__dirname, '..', '..');

function carpetaTemporal(archivos) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentes-'));
	for (const [nombre, contenido] of Object.entries(archivos)) {
		fs.writeFileSync(path.join(dir, nombre), contenido);
	}
	return dir;
}

const CUERPO = '## Rol\n\nTexto.\n\n## Procedimiento\n\n1. Paso.\n\n## Reglas\n\n- Regla.\n\n## Reporte\n\nFormato.\n';

function rol(nombre, extra = {}) {
	const meta = {
		name: nombre,
		description: 'Descripción suficientemente larga para pasar la validación mínima.',
		acceso: 'lectura',
		alcance: 'ninguno',
		capacidad: 'media',
		...extra,
	};
	const fm = Object.entries(meta).filter(([k]) => k !== 'cuerpo').map(([k, v]) => `${k}: ${v}`).join('\n');
	return `---\n${fm}\n---\n\n${extra.cuerpo ?? CUERPO}`;
}

test('los roles del repo son válidos', () => {
	assert.deepStrictEqual(validar(path.join(RAIZ, 'agents')), []);
});

test('un rol bien formado no tiene problemas', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor') });
	assert.deepStrictEqual(validar(dir, carpetaSkills({})), []);
});

test('detecta name distinto del archivo y acceso inválido', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('otro', { acceso: 'todo' }) });
	const problemas = validar(dir, carpetaSkills({})).join('\n');
	assert.match(problemas, /no coincide con el nombre del archivo/);
	assert.match(problemas, /acceso "todo"/);
});

test('detecta texto atado a un modelo o a un host', () => {
	const cuerpo = CUERPO + '\nUsá el modelo haiku para esto y el hook $CLAUDE_PROJECT_DIR.\n';
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor', { cuerpo }) });
	const problemas = validar(dir, carpetaSkills({})).join('\n');
	assert.match(problemas, /haiku/);
	assert.match(problemas, /CLAUDE_PROJECT_DIR/);
});

test('exige el formato de VEREDICTO al revisor', () => {
	const dir = carpetaTemporal({ 'revisor.md': rol('revisor') });
	assert.match(validar(dir, carpetaSkills({})).join('\n'), /formato de VEREDICTO/);
});

test('detecta secciones obligatorias faltantes', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor', { cuerpo: '## Rol\n\nSolo esto.\n' }) });
	const problemas = validar(dir, carpetaSkills({})).join('\n');
	assert.match(problemas, /falta la sección "## Procedimiento"/);
	assert.match(problemas, /falta la sección "## Reporte"/);
});

test('detecta capacidad inválida', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor', { capacidad: 'enorme' }) });
	assert.match(validar(dir, carpetaSkills({})).join('\n'), /capacidad "enorme"/);
});

function carpetaSkills(skills) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-'));
	for (const [nombre, contenido] of Object.entries(skills)) {
		fs.mkdirSync(path.join(dir, nombre));
		fs.writeFileSync(path.join(dir, nombre, 'SKILL.md'), contenido);
	}
	return dir;
}

const SKILL_OK = (nombre, usadoPor = 'auditor') => `---
name: ${nombre}
description: Descripción de una skill de prueba con texto suficiente para validar.
usado_por: ${usadoPor}
fuente: origen de prueba (MIT)
---

# Título

Cuerpo.
`;

test('una skill válida y referenciada por su rol pasa', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor', { skills: 'probar' }) });
	const skills = carpetaSkills({ probar: SKILL_OK('probar') });
	assert.deepStrictEqual(validar(dir, skills), []);
});

test('detecta una skill que el rol referencia y no existe', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor', { skills: 'fantasma' }) });
	assert.match(validar(dir, carpetaSkills({})).join('\n'), /la skill "fantasma" no existe/);
});

test('detecta una skill cuyo usado_por no lista al rol', () => {
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor', { skills: 'probar' }) });
	const skills = carpetaSkills({ probar: SKILL_OK('probar', 'otro-rol') });
	assert.match(validar(dir, skills).join('\n'), /no lista a "auditor"/);
});

test('detecta una skill sin fuente', () => {
	const sinFuente = SKILL_OK('probar').replace(/^fuente:.*\n/m, '');
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor') });
	assert.match(validar(dir, carpetaSkills({ probar: sinFuente })).join('\n'), /falta fuente/);
});

test('detecta texto atado a un modelo dentro de una skill', () => {
	const contaminada = SKILL_OK('probar').replace('Cuerpo.', 'Usá haiku para esto.');
	const dir = carpetaTemporal({ 'auditor.md': rol('auditor') });
	assert.match(validar(dir, carpetaSkills({ probar: contaminada })).join('\n'), /haiku/);
});

