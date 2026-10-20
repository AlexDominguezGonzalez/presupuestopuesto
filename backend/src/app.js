const express = require('express');
const cors = require('cors');
const { TARIFAS } = require('./tarifas');
const { validarPresupuesto } = require('./validacion');
const { calcularPresupuesto } = require('./calculo');

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/estado
app.get('/api/estado', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GET /api/tarifas
app.get('/api/tarifas', (req, res) => {
  res.status(200).json(TARIFAS);
});

// POST /api/presupuesto — el manejador solo valida, delega el cálculo y responde
app.post('/api/presupuesto', (req, res) => {
  if (!req.is('application/json')) {
    return res.status(400).json({ error: 'La petición debe enviarse con Content-Type: application/json.' });
  }
  const resultado = validarPresupuesto(req.body);
  if (!resultado.ok) {
    return res.status(400).json({ error: resultado.errores.join(' '), detalles: resultado.errores });
  }
  return res.status(200).json(calcularPresupuesto(resultado.datos));
});

// JSON mal formado
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  return next(err);
});

// Ruta inexistente
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

module.exports = app;
