// Ejecuta las 9 pruebas del enunciado contra la API real (levanta el servidor en un puerto libre).
const app = require('../src/app');

const casos = [
  { n: 1, desc: 'Estado del servidor', metodo: 'GET', ruta: '/api/estado', esperado: 200 },
  { n: 2, desc: 'Consultar tarifas', metodo: 'GET', ruta: '/api/tarifas', esperado: 200 },
  { n: 3, desc: 'Landing mínima', body: { tipo: 'landing', paginas: 1, formulario: false, segundoIdioma: false }, esperado: 200 },
  { n: 4, desc: 'Corporativa completa', body: { tipo: 'corporativa', paginas: 5, formulario: true, segundoIdioma: true }, esperado: 200 },
  { n: 5, desc: 'Tipo no válido', body: { tipo: 'tienda', paginas: 3, formulario: false, segundoIdioma: false }, esperado: 400 },
  { n: 6, desc: 'Páginas como string', body: { tipo: 'landing', paginas: '4', formulario: false, segundoIdioma: false }, esperado: 400 },
  { n: 7, desc: 'Páginas decimal', body: { tipo: 'landing', paginas: 2.5, formulario: false, segundoIdioma: false }, esperado: 400 },
  { n: 8, desc: 'Falta un campo', body: { tipo: 'landing', paginas: 3, formulario: true }, esperado: 400 },
  { n: 9, desc: 'Precio enviado por el cliente (se ignora)', body: { tipo: 'landing', paginas: 3, formulario: true, segundoIdioma: false, precio: 1, total: 0 }, esperado: 200 },
];

const server = app.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  let fallos = 0;
  for (const c of casos) {
    const opts = c.body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c.body) }
      : { method: c.metodo };
    const r = await fetch(base + (c.ruta || '/api/presupuesto'), opts);
    const json = await r.json();
    const ok = r.status === c.esperado;
    if (!ok) fallos++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} #${c.n} ${c.desc} -> ${r.status} ${JSON.stringify(json)}`);
  }
  console.log(`\n${casos.length - fallos}/${casos.length} pruebas superadas`);
  server.close();
  process.exitCode = fallos ? 1 : 0;
});
