import { catalogoSinPrecios } from "@/lib/catalogo"

// Catálogo para que el usuario añada servicios a mano. Sin precios: se calculan al confirmar.
export async function GET() {
  return Response.json(catalogoSinPrecios())
}
