import { calcularPresupuesto } from "@/lib/catalogo"
import { errorJSON, leerJSON } from "@/lib/http"
import { validarConfirmacion } from "@/lib/validacion"

// Recibe SOLO los IDs confirmados por el usuario; los precios salen del catálogo del servidor.
export async function POST(request: Request) {
  const validacion = validarConfirmacion(await leerJSON(request))
  if (!validacion.ok) return errorJSON(400, validacion.errores)

  return Response.json({ ...calcularPresupuesto(validacion.datos.ids), fecha: new Date().toISOString() })
}
