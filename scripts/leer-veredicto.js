#!/usr/bin/env node
// Lee el reporte de un agente y decide si el check de CI pasa. Usa las mismas líneas fijas que lee el
// workflow del apply (workflows/apply-change.js).
//
// Uso: node scripts/leer-veredicto.js revisor|seguridad <reporte>
//   revisor    pasa solo con "VEREDICTO: APROBADO".
//   seguridad  pasa solo con "CRITICAL: 0  WARNING: 0".
// Sale con 0 si pasa, 1 si no pasa o el reporte no tiene la línea fija, y 2 si el uso es incorrecto.

const fs = require('fs');

// Tolera que el modelo envuelva la línea en negrita o en un bloque de código.
const VEREDICTO = /^[\s*`]*VEREDICTO:\s*(APROBADO|CAMBIOS REQUERIDOS|SIN HALLAZGOS|CON HALLAZGOS)[\s*`]*$/gm;
const CONTEOS = /CRITICAL:\s*(\d+)\s+WARNING:\s*(\d+)/g;

/** La última coincidencia: si el reporte cita el formato antes, vale la línea del final. */
function ultima(regex, texto) {
	const todas = [...texto.matchAll(regex)];
	return todas.length > 0 ? todas[todas.length - 1] : null;
}

/** Devuelve { pasa, motivo }. */
function leerVeredicto(modo, reporte) {
	const veredicto = ultima(VEREDICTO, reporte);
	if (modo === 'revisor') {
		if (!veredicto) {
			return { pasa: false, motivo: 'el reporte del revisor no tiene la línea VEREDICTO' };
		}
		if (veredicto[1] === 'APROBADO') {
			return { pasa: true, motivo: 'VEREDICTO: APROBADO' };
		}
		const puntos = reporte.slice(veredicto.index).split('\n').filter(l => /^\s*\d+\.\s/.test(l));
		return { pasa: false, motivo: [`VEREDICTO: ${veredicto[1]}`, ...puntos.map(p => p.trim())].join('\n') };
	}
	if (modo === 'seguridad') {
		const conteos = ultima(CONTEOS, reporte);
		if (!veredicto || !conteos) {
			return { pasa: false, motivo: 'el reporte del security-auditor no tiene las líneas VEREDICTO y CRITICAL/WARNING' };
		}
		const resumen = `VEREDICTO: ${veredicto[1]} (CRITICAL ${conteos[1]}, WARNING ${conteos[2]})`;
		return { pasa: Number(conteos[1]) === 0 && Number(conteos[2]) === 0, motivo: resumen };
	}
	throw new Error(`modo desconocido: ${modo}`);
}

if (require.main === module) {
	const [modo, archivo] = process.argv.slice(2);
	if (!['revisor', 'seguridad'].includes(modo) || !archivo || !fs.existsSync(archivo)) {
		console.error('Uso: node scripts/leer-veredicto.js revisor|seguridad <reporte>');
		process.exit(2);
	}
	const { pasa, motivo } = leerVeredicto(modo, fs.readFileSync(archivo, 'utf8'));
	console.log(motivo);
	process.exit(pasa ? 0 : 1);
}

module.exports = { leerVeredicto };
