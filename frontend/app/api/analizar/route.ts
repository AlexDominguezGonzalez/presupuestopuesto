import { analizarSolicitud, ErrorIA } from "@/lib/ia"
import { errorJSON, leerJSON } from "@/lib/http"
import { validarSolicitud } from "@/lib/validacion"

// Margen para la llamada a OpenAI (15 s por intento, 1 reintento).
export const maxDuration = 60

export async function POST(request: Request) {
  const validacion = validarSolicitud(await leerJSON(request))
  if (!validacion.ok) return errorJSON(400, validacion.errores)

  try {
    const propuesta = await analizarSolicitud(validacion.datos.descripcion)
    return Response.json({ cliente: validacion.datos.cliente, ...propuesta })
  } catch (err) {
    if (err instanceof ErrorIA) return errorJSON(err.status, [err.message])
    console.error("[analizar] Error inesperado:", err)
    return errorJSON(500, ["Ha ocurrido un error inesperado. Inténtalo de nuevo."])
  }
}
