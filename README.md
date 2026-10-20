# API de Presupuestos Web — Node.js + Express

API REST que calcula el presupuesto de una página web (landing o corporativa) a partir de las opciones del cliente. **Las tarifas viven únicamente en el servidor**: el cliente solo envía opciones y cualquier precio que envíe se ignora.

Incluye una ampliación de frontend con **Next.js + shadcn/ui** que consume la API.

```
Presupuesto/
├── backend/                 ← API (Node.js + Express, JavaScript puro)
│   ├── package.json
│   ├── src/
│   │   ├── server.js        ← arranque (puerto)
│   │   ├── app.js           ← Express: middlewares y rutas
│   │   ├── tarifas.js       ← tarifas fijas (única fuente de precios)
│   │   ├── validacion.js    ← validación estricta del cuerpo
│   │   └── calculo.js       ← función de cálculo pura e independiente
│   └── test/pruebas.js      ← script que ejecuta las 9 pruebas
└── persupuesto/             ← frontend Next.js + shadcn/ui (app/page.tsx)
```

## 1. Requisitos

- Node.js 18 o superior (usa `fetch` nativo en las pruebas).
- npm.

## 2. Instalación y ejecución del backend

```bash
cd backend
npm install        # instala express y cors
npm start          # arranca la API
```

Salida esperada:

```
API de presupuestos escuchando en http://localhost:3001
```

- **Puerto por defecto: `3001`** (el 3000 queda libre para Next.js).
- Para cambiarlo: `PORT=4000 npm start` (Linux/macOS) o `$env:PORT=4000; npm start` (PowerShell).
- `npm run dev` arranca en modo recarga automática (`node --watch`).
- `npm test` ejecuta las 9 pruebas documentadas abajo.

## 3. Rutas

| Método | Ruta | Descripción | Respuesta |
|---|---|---|---|
| GET | `/api/estado` | Comprobación de salud | `200 {"status":"ok"}` |
| GET | `/api/tarifas` | Tarifas vigentes | `200 {"landing":300,"corporativa":600,"paginaAdicional":50,"formulario":80,"segundoIdioma":150,"moneda":"EUR"}` |
| POST | `/api/presupuesto` | Calcula el presupuesto (JSON) | `200` desglose · `400` error de validación |

### Tarifas (fijas en `src/tarifas.js`)

| Concepto | Precio |
|---|---|
| Landing (incluye 1ª página) | 300 € |
| Web corporativa (incluye 1ª página) | 600 € |
| Página adicional | 50 € |
| Formulario de contacto | 80 € |
| Segundo idioma | 150 € |

Sin impuestos ni descuentos.

### Cuerpo de `POST /api/presupuesto`

```json
{ "tipo": "corporativa", "paginas": 5, "formulario": true, "segundoIdioma": true }
```

Respuesta `200`:

```json
{ "base": 600, "paginasAdicionales": 200, "formulario": 80, "segundoIdioma": 150, "total": 1030, "moneda": "EUR" }
```

> `paginasAdicionales` es el **coste en euros** de las páginas extra, no su cantidad.

Respuesta `400` (ejemplo):

```json
{ "error": "El campo \"paginas\" debe ser un número entero entre 1 y 20.", "detalles": ["El campo \"paginas\" debe ser un número entero entre 1 y 20."] }
```

## 4. Cómo funciona, paso a paso

1. **Recepción** (`app.js`): `express.json()` parsea el cuerpo. Si no es JSON válido → `400`. Si el `Content-Type` no es `application/json` → `400`.
2. **Validación** (`validacion.js`, antes de calcular):
   - El cuerpo debe ser un objeto (no `null`, ni array, ni primitivo).
   - Deben existir `tipo`, `paginas`, `formulario` y `segundoIdioma`; si falta alguno se indica cuál.
   - `tipo` ∈ {`"landing"`, `"corporativa"`}.
   - `paginas` debe ser un **entero** entre 1 y 20 (`Number.isInteger`): se rechazan `"4"`, `2.5`, `0`, `21`, `null`.
   - `formulario` y `segundoIdioma` deben ser **booleanos puros** (`typeof === "boolean"`): se rechazan `"true"`, `1`, etc.
   - Se devuelven **solo** los cuatro campos permitidos: cualquier propiedad extra (por ejemplo `precio` o `total`) se descarta.
   - Si hay errores → `400` con mensaje descriptivo (`error`) y lista (`detalles`).
3. **Cálculo** (`calculo.js`): `calcularPresupuesto(datos)` es una función pura, sin `req`/`res`, que solo usa `TARIFAS`:
   `total = base(tipo) + (paginas − 1) × 50 + (formulario ? 80 : 0) + (segundoIdioma ? 150 : 0)`.
4. **Respuesta**: el manejador devuelve `200` con el desglose y `moneda: "EUR"`.
5. Rutas inexistentes → `404`.

El manejador de la ruta solo orquesta (valida → calcula → responde); el cálculo puede reutilizarse o probarse sin Express.

## 5. Pruebas

Se pueden reproducir todas con `npm test` (levanta la API en un puerto libre y lanza las peticiones reales) o manualmente con curl/Postman/Thunder Client. Todas las POST usan `Content-Type: application/json`.

| # | Caso | Solicitud enviada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| 1 | Estado | `GET /api/estado` | `200` `{"status":"ok"}` | ✅ `200` `{"status":"ok"}` |
| 2 | Tarifas | `GET /api/tarifas` | `200` con las 5 tarifas | ✅ `200` `{"landing":300,"corporativa":600,"paginaAdicional":50,"formulario":80,"segundoIdioma":150,"moneda":"EUR"}` |
| 3 | Landing mínima | `POST` `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | `200`, total 300 | ✅ `200` `{"base":300,"paginasAdicionales":0,"formulario":0,"segundoIdioma":0,"total":300,"moneda":"EUR"}` |
| 4 | Corporativa completa | `POST` `{"tipo":"corporativa","paginas":5,"formulario":true,"segundoIdioma":true}` | `200`, 600+200+80+150 = 1030 | ✅ `200` `{"base":600,"paginasAdicionales":200,"formulario":80,"segundoIdioma":150,"total":1030,"moneda":"EUR"}` |
| 5 | Tipo no válido | `POST` `{"tipo":"tienda","paginas":3,"formulario":false,"segundoIdioma":false}` | `400` tipo no permitido | ✅ `400` `El campo "tipo" solo puede ser "landing" o "corporativa".` |
| 6 | Páginas como texto | `POST` `{"tipo":"landing","paginas":"4","formulario":false,"segundoIdioma":false}` | `400` páginas no entero | ✅ `400` `El campo "paginas" debe ser un número entero entre 1 y 20.` |
| 7 | Páginas decimal | `POST` `{"tipo":"landing","paginas":2.5,"formulario":false,"segundoIdioma":false}` | `400` páginas no entero | ✅ `400` `El campo "paginas" debe ser un número entero entre 1 y 20.` |
| 8 | Falta un campo | `POST` `{"tipo":"landing","paginas":3,"formulario":true}` | `400` indica el campo que falta | ✅ `400` `Faltan campos obligatorios: segundoIdioma.` |
| 9 | Precio manipulado por el cliente | `POST` `{"tipo":"landing","paginas":3,"formulario":true,"segundoIdioma":false,"precio":1,"total":0}` | `200`, se ignoran `precio`/`total`: 300+100+80 = 480 | ✅ `200` `{"base":300,"paginasAdicionales":100,"formulario":80,"segundoIdioma":0,"total":480,"moneda":"EUR"}` |

Salida de `npm test`: **9/9 pruebas superadas**.

Ejemplo manual con curl:

```bash
curl -X POST http://localhost:3001/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":5,"formulario":true,"segundoIdioma":true}'
```

## 6. Frontend (ampliación): Next.js + shadcn/ui

Proyecto creado con `npx shadcn@latest init --preset b0 --template next` en `persupuesto/`.

Componentes de shadcn necesarios:

```bash
cd persupuesto
npx shadcn@latest add card input label select switch alert badge separator spinner
```

(`button` ya viene con la plantilla.)

Ejecución (con el backend ya arrancado en el 3001):

```bash
npm run dev          # http://localhost:3000
```

Si la API está en otra URL, crear `persupuesto/.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:4000`.

Funcionamiento de `app/page.tsx`:
- Al cargar consulta `GET /api/estado` y muestra un indicador «conectada / sin conexión».
- El formulario (Select de tipo, Input de páginas, dos Switch) envía **solo opciones**, nunca precios.
- Mientras se espera la respuesta, el botón se desactiva y muestra un spinner.
- `200` → tarjeta con el desglose (base, páginas adicionales, formulario, segundo idioma) y el total.
- `400` → alerta roja con los mensajes de validación del servidor (p. ej. al poner 0 o 25 páginas).
- Si la API no responde → alerta de conexión.
