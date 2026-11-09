import "server-only"

import { buscarServicio } from "@/lib/catalogo"

export const MAX_DESCRIPCION = 1000
export const MAX_CLIENTE = 100

type Resultado<T> = { ok: true; datos: T } | { ok: false; errores: string[] }

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)

/** POST /api/analizar → { cliente, descripcion } */
export function validarSolicitud(body: unknown): Resultado<{ cliente: string; descripcion: string }> {
  if (!esObjeto(body)) return { ok: false, errores: ["El cuerpo de la petición debe ser un objeto JSON."] }

  const errores: string[] = []
  const cliente = typeof body.cliente === "string" ? body.cliente.trim() : ""
  const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim() : ""

  if (!cliente) errores.push("Indica el nombre del cliente o empresa.")
  else if (cliente.length > MAX_CLIENTE) errores.push(`El nombre no puede superar ${MAX_CLIENTE} caracteres.`)

  if (!descripcion) errores.push("La descripción del proyecto no puede estar vacía.")
  else if (descripcion.length < 10) errores.push("Explica un poco más el proyecto (mínimo 10 caracteres).")
  else if (descripcion.length > MAX_DESCRIPCION)
    errores.push(`La descripción no puede superar ${MAX_DESCRIPCION} caracteres (tiene ${descripcion.length}).`)

  if (errores.length) return { ok: false, errores }
  return { ok: true, datos: { cliente, descripcion } }
}

/** POST /api/presupuesto → { ids: string[] }. Cualquier precio enviado se ignora. */
export function validarConfirmacion(body: unknown): Resultado<{ ids: string[] }> {
  if (!esObjeto(body)) return { ok: false, errores: ["El cuerpo de la petición debe ser un objeto JSON."] }
  if (!Array.isArray(body.ids)) return { ok: false, errores: ['El campo "ids" debe ser una lista de servicios.'] }
  if (body.ids.length === 0) return { ok: false, errores: ["Selecciona al menos un servicio."] }
  if (body.ids.length > 50) return { ok: false, errores: ["Demasiados servicios en la petición."] }

  const desconocidos = body.ids.filter((id) => typeof id !== "string" || !buscarServicio(id))
  if (desconocidos.length) {
    return {
      ok: false,
      errores: [`Servicios no reconocidos en el catálogo: ${desconocidos.map(String).join(", ")}.`],
    }
  }
  return { ok: true, datos: { ids: [...new Set(body.ids as string[])] } }
}
