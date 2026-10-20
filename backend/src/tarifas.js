// Tarifas oficiales. ÚNICA fuente de precios: el cliente nunca envía precios.
const TARIFAS = Object.freeze({
  landing: 300,          // incluye la 1ª página
  corporativa: 600,      // incluye la 1ª página
  paginaAdicional: 50,
  formulario: 80,
  segundoIdioma: 150,
  moneda: 'EUR',
});

module.exports = { TARIFAS };
