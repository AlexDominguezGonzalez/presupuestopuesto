# PRUEBAS — POST /api/presupuesto

| # | Caso | Solicitud enviada | Resultado esperado | Resultado obtenido |
|---|------|-------------------|--------------------|--------------------|
| 1 | Landing, 1 página, sin extras | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | **HTTP 200** · Total: **300 €** | ✅ Exitoso — HTTP 200 · Total 300 € (coincide con el esperado) |
| 2 | Corporativa, 4 páginas, con formulario y sin segundo idioma | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | **HTTP 200** · Total: **830 €** | ✅ Exitoso — HTTP 200 · Total 830 € (coincide con el esperado) |
| 3 | Landing, 2 páginas, ambos extras | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | **HTTP 200** · Total: **580 €** | ✅ Exitoso — HTTP 200 · Total 580 € (coincide con el esperado) |
| 4 | Landing, 20 páginas (máximo), sin extras | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | **HTTP 200** · Total: **1.250 €** | ✅ Exitoso — HTTP 200 · Total 1.250 € (coincide con el esperado) |
| 5 | `paginas: 0` (por debajo del mínimo) | `{"tipo":"landing","paginas":0,"formulario":false,"segundoIdioma":false}` | **HTTP 400** · `El campo "paginas" debe ser un número entero entre 1 y 20.` | ✅ Exitoso — HTTP 400 con el mensaje esperado (coincide con el esperado) |
| 6 | `paginas: 21` (por encima del máximo) | `{"tipo":"landing","paginas":21,"formulario":false,"segundoIdioma":false}` | **HTTP 400** · `El campo "paginas" debe ser un número entero entre 1 y 20.` | ✅ Exitoso — HTTP 400 con el mensaje esperado (coincide con el esperado) |
| 7 | `paginas: 2.5` (decimal) | `{"tipo":"landing","paginas":2.5,"formulario":false,"segundoIdioma":false}` | **HTTP 400** · `El campo "paginas" debe ser un número entero entre 1 y 20.` | ✅ Exitoso — HTTP 400 con el mensaje esperado (coincide con el esperado) |
| 8 | `tipo: "tienda"` (tipo no permitido) | `{"tipo":"tienda","paginas":1,"formulario":false,"segundoIdioma":false}` | **HTTP 400** · `El campo "tipo" solo puede ser "landing" o "corporativa".` | ✅ Exitoso — HTTP 400 con el mensaje esperado (coincide con el esperado) |
| 9 | `formulario: "false"` (string en lugar de booleano) | `{"tipo":"landing","paginas":1,"formulario":"false","segundoIdioma":false}` | **HTTP 400** · Error de validación: `formulario` debe ser booleano | ✅ Exitoso — HTTP 400 por tipo de dato incorrecto (coincide con el esperado) |
