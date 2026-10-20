const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API de presupuestos escuchando en http://localhost:${PORT}`);
});
