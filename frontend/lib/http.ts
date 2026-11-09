import "server-only"

/** Lee el cuerpo JSON de la petición; devuelve undefined si no es JSON válido. */
export async function leerJSON(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

export function errorJSON(status: number, errores: string[]) {
  return Response.json({ error: errores.join(" "), detalles: errores }, { status })
}
