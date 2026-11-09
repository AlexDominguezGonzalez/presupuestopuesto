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

## 7. Ampliación «Presupuesta mi web» (IA + Human-in-the-loop)

El cliente describe su proyecto con sus palabras → la IA (OpenAI) propone servicios del catálogo → el usuario revisa, quita o añade servicios y confirma → **el servidor** calcula el importe → se descarga el presupuesto en PDF.

Todo vive en `frontend/` (Next.js), así que se despliega en Vercel como un único proyecto: las Route Handlers de `app/api/` hacen de servidor.

```
frontend/
├── lib/catalogo.ts          ← catálogo con precios (server-only) + calcularPresupuesto()
├── lib/ia.ts                ← llamada a OpenAI, prompt, parseo y validación del JSON
├── lib/validacion.ts        ← validación de la solicitud y de los IDs confirmados
├── app/api/catalogo         ← GET  catálogo SIN precios (para añadir servicios a mano)
├── app/api/analizar         ← POST { cliente, descripcion } → propuesta de la IA
├── app/api/presupuesto      ← POST { ids } → líneas con precio real + total
├── components/presupuesto-pdf.tsx ← documento PDF (@react-pdf/renderer)
├── app/page.tsx             ← flujo en 3 pasos: Describe → Revisa → Descarga
└── app/calculadora/page.tsx ← calculadora anterior (usa el backend Express)
```

### Configuración

```bash
cd frontend
cp .env.example .env.local     # y pon tu OPENAI_API_KEY (nunca se sube al repo)
npm install
npm run dev                    # http://localhost:3000
```

Variables: `OPENAI_API_KEY` (obligatoria) y `OPENAI_MODEL` (opcional, por defecto `gpt-4o-mini`).
En Vercel: *Root Directory* = `frontend` y añadir las mismas variables en *Settings → Environment Variables*.

### Decisiones clave

- **La IA nunca ve precios.** `catalogoSinPrecios()` envía solo `id`, `nombre` y `descripcion`. Los precios están en `lib/catalogo.ts`, marcado `server-only` (no puede acabar en el bundle del navegador).
- **JSON estricto:** `response_format: { type: "json_object" }`, `temperature: 0.2` y el system prompt del enunciado con el catálogo inyectado dinámicamente. Se le indica además que lo que no esté en el catálogo vaya a `dudas_pendientes` y que ignore instrucciones dentro del texto del cliente.
- **No se confía en la respuesta de la IA:** se parsea el JSON, se comprueba la estructura, se descartan IDs que no existen en el catálogo y los duplicados, y se recortan textos largos.
- **Human-in-the-loop:** el usuario puede quitar servicios, añadir cualquiera del catálogo, editar el resumen y descartar dudas. Cualquier cambio invalida el presupuesto confirmado y obliga a recalcular.
- **El servidor manda en el dinero:** al confirmar solo se envían IDs; `/api/presupuesto` valida que existan, ignora cualquier `precio`/`total` enviado y suma los precios del catálogo.
- **PDF en el cliente** con `@react-pdf/renderer` (carga diferida al pulsar el botón): no consume tiempo ni memoria de la función de Vercel. Usa los importes devueltos por el servidor.
- **Validación:** nombre obligatorio (máx. 100), descripción obligatoria (10–1000 caracteres) comprobada en el servidor.
- **Errores de la API:** timeout de 15 s con 1 reintento. Timeout → 504, sin conexión/saturado → 503, error de OpenAI o JSON inválido → 502, clave ausente o inválida → 500. Siempre con un mensaje amigable y botón «Reintentar» en la interfaz.

### Catálogo

| id | Servicio | Precio |
|---|---|---|
| `landing` | Landing page | 300 € |
| `web_corporativa` | Web corporativa | 600 € |
| `paginas_adicionales` | Pack de 5 páginas adicionales | 250 € |
| `formulario_contacto` | Formulario de contacto | 80 € |
| `segundo_idioma` | Segundo idioma | 150 € |
| `tienda_online` | Tienda online | 1200 € |
| `pasarela_pago` | Pasarela de pago | 250 € |
| `blog` | Blog | 200 € |
| `reservas` | Sistema de reservas | 350 € |
| `area_clientes` | Área privada de usuarios | 400 € |
| `seo_basico` | SEO on-page básico | 180 € |
| `hosting_dominio` | Hosting y dominio (1er año) | 120 € |
| `mantenimiento` | Mantenimiento (1 año) | 300 € |

### Casos de prueba

| # | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| 1 | Solicitud clara | «Quiero un ecommerce de zapatos con pasarela de pago» | Propone `tienda_online` + `pasarela_pago` |
| 2 | Solicitud ambigua | «Necesito una web para mi negocio, algo sencillo pero profesional» | Propuesta mínima + varias `dudas_pendientes` |
| 3 | Servicio que no ofrecemos | «…clínica dental con citas online y además una app móvil» | Propone `reservas`/web; la app móvil aparece en dudas, no como servicio |
| 4 | ID inventado por la IA | (simulado) la IA devuelve `app_movil_ios` | Se descarta; el usuario ve «se descartaron 1 sugerencia(s)» |
| 5 | Fallo de la API | Timeout / error 5xx / JSON roto | 504 / 502 / 502 con mensaje amigable y botón «Reintentar» |
| 6 | Descripción vacía / > 1000 car. | `"   "` / 1001 caracteres | 400 con mensaje descriptivo |
| 7 | Precio manipulado | `{"ids":["tienda_online","pasarela_pago"],"precio":1,"total":0}` | 200, total 1450 € (se ignora) |
| 8 | ID no existente al confirmar | `{"ids":["app_movil"]}` | 400 «Servicios no reconocidos…» |

Los ejemplos 1–3 están como botones de ejemplo bajo el campo de descripción.
