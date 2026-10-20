const TIPOS_VALIDOS = ['landing', 'corporativa'];
const CAMPOS_OBLIGATORIOS = ['tipo', 'paginas', 'formulario', 'segundoIdioma'];

/**
 * Valida el cuerpo de la petición.
 * Devuelve { ok: true, datos } con SOLO los campos permitidos (se ignoran extras)
 * o { ok: false, errores: [...] } con mensajes descriptivos.
 */
function validarPresupuesto(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errores: ['El cuerpo de la petición debe ser un objeto JSON.'] };
  }

  const errores = [];

  const faltan = CAMPOS_OBLIGATORIOS.filter((c) => !Object.prototype.hasOwnProperty.call(body, c));
  if (faltan.length > 0) {
    errores.push(`Faltan campos obligatorios: ${faltan.join(', ')}.`);
  }

  const { tipo, paginas, formulario, segundoIdioma } = body;

  if ('tipo' in body && !TIPOS_VALIDOS.includes(tipo)) {
    errores.push('El campo "tipo" solo puede ser "landing" o "corporativa".');
  }
  if ('paginas' in body && !(Number.isInteger(paginas) && paginas >= 1 && paginas <= 20)) {
    errores.push('El campo "paginas" debe ser un número entero entre 1 y 20.');
  }
  if ('formulario' in body && typeof formulario !== 'boolean') {
    errores.push('El campo "formulario" debe ser un booleano (true o false).');
  }
  if ('segundoIdioma' in body && typeof segundoIdioma !== 'boolean') {
    errores.push('El campo "segundoIdioma" debe ser un booleano (true o false).');
  }

  if (errores.length > 0) return { ok: false, errores };
  return { ok: true, datos: { tipo, paginas, formulario, segundoIdioma } };
}

module.exports = { validarPresupuesto, TIPOS_VALIDOS };
