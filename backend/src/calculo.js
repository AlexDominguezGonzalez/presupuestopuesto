const { TARIFAS } = require('./tarifas');

/**
 * Función de cálculo PURA e independiente de Express.
 * Recibe datos ya validados y devuelve el desglose en euros.
 * Fórmula: base(tipo) + (paginas - 1) * 50 + extras
 */
function calcularPresupuesto({ tipo, paginas, formulario, segundoIdioma }) {
  const base = TARIFAS[tipo];
  const paginasAdicionales = (paginas - 1) * TARIFAS.paginaAdicional; // coste en €, no cantidad
  const costeFormulario = formulario ? TARIFAS.formulario : 0;
  const costeIdioma = segundoIdioma ? TARIFAS.segundoIdioma : 0;

  return {
    base,
    paginasAdicionales,
    formulario: costeFormulario,
    segundoIdioma: costeIdioma,
    total: base + paginasAdicionales + costeFormulario + costeIdioma,
    moneda: TARIFAS.moneda,
  };
}

module.exports = { calcularPresupuesto };
